package main

import (
	"encoding/json"
	"log"
	"net/http"

	"chambu/server/internal/config"
	"chambu/server/internal/models"
	"chambu/server/internal/repository"
	"chambu/server/internal/service"
	"chambu/server/internal/storage"
	"chambu/server/internal/transport"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func main() {
	cfg := config.FromEnv()
	db := config.OpenDatabase(cfg)
	migrate(db)
	seed(db)

	store := buildStorage(cfg)
	adminRepo := repository.NewAdminRepository(db)
	menuRepo := repository.NewMenuRepository(db)
	orderRepo := repository.NewOrderRepository(db)

	menuService := service.NewMenuService(menuRepo, store)
	orderService := service.NewOrderService(orderRepo, menuRepo)
	adminService := service.NewAdminService(adminRepo)
	authService := service.NewAuthService(adminRepo)

	router := gin.Default()
	router.MaxMultipartMemory = 8 << 20
	transport.RegisterRoutes(router, menuService, orderService, adminService, authService)
	router.StaticFS("/assets", http.Dir(cfg.ClientDir+"/assets"))
	router.StaticFS("/src", http.Dir(cfg.ClientDir+"/src"))
	router.StaticFile("/styles.css", cfg.ClientDir+"/styles.css")
	router.StaticFile("/", cfg.ClientDir+"/index.html")
	router.NoRoute(func(c *gin.Context) {
		c.File(cfg.ClientDir + "/index.html")
	})

	log.Printf("ChamBu API listening on http://localhost%s", cfg.Addr())
	if err := router.Run(cfg.Addr()); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

func migrate(db *gorm.DB) {
	if err := db.AutoMigrate(
		&models.BrandSettings{},
		&models.MenuCategory{},
		&models.MenuItem{},
		&models.Admin{},
		&models.Order{},
		&models.OrderItem{},
	); err != nil {
		log.Fatalf("migrate database: %v", err)
	}
}

func seed(db *gorm.DB) {
	highlights, _ := json.Marshal([]string{"с собой", "завтраки весь день", "свежая выпечка"})
	db.FirstOrCreate(&models.BrandSettings{}, models.BrandSettings{
		ID:          1,
		Name:        "ЧамБу",
		Subtitle:    "Блины, завтраки и напитки в Грозном",
		Description: "Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.",
		Phone:       "+7 938 994-88-00",
		Address:     "Грозный, ул. Хамзата Орзамиева, 30/30А",
		Hours:       "Ежедневно 08:00-22:00",
		Highlights:  datatypes.JSON(highlights),
	})

	fixedCategories := []models.MenuCategory{
		{Slug: "pancakes", Name: "Блины", Description: "Сладкие и сытные блины с аккуратной подачей.", SortOrder: 10},
		{Slug: "breakfast", Name: "Завтраки", Description: "Сытные блюда для утра и позднего старта.", SortOrder: 20},
		{Slug: "drinks", Name: "Напитки", Description: "Кофе, чай, лимонады и сезонные вкусы.", SortOrder: 30},
	}

	db.Where("slug NOT IN ?", []string{"pancakes", "breakfast", "drinks"}).Delete(&models.MenuCategory{})
	for _, category := range fixedCategories {
		var existing models.MenuCategory
		db.Where("slug = ?", category.Slug).FirstOrCreate(&existing, category)
		existing.Name = category.Name
		existing.Description = category.Description
		existing.SortOrder = category.SortOrder
		db.Save(&existing)
	}

	items := []models.MenuItem{
		menuSeed("pancake-honey", "pancakes", "Блин с медом", "Тонкий румяный блин со сливочным маслом и горным медом.", 190, "180 г", []string{"нежный"}, "dessert", 10),
		menuSeed("pancake-chicken", "pancakes", "Блин с курицей", "Сытная начинка из курицы, сыра и зелени.", 290, "240 г", []string{"сытно"}, "breakfast", 20),
		menuSeed("pancake-berry", "pancakes", "Блин с ягодами", "Творожный крем, ягодный соус и легкая сахарная пудра.", 270, "220 г", []string{"хит"}, "syrniki", 30),
		menuSeed("omelet-cheese", "breakfast", "Омлет с сыром", "Воздушный омлет, свежая зелень и теплый хлеб.", 320, "260 г", []string{"завтрак"}, "breakfast", 10),
		menuSeed("syrniki", "breakfast", "Сырники", "Творожные сырники со сметаной и ягодным соусом.", 340, "240 г", []string{"сладкое"}, "syrniki", 20),
		menuSeed("croissant-salmon", "breakfast", "Круассан с лососем", "Хрустящий круассан, сливочный сыр, лосось и свежий огурец.", 430, "210 г", []string{"премиум"}, "croissant", 30),
		menuSeed("raf-cardamom", "drinks", "Раф кардамон", "Сливочный кофе с тонкой пряной нотой и бархатной пеной.", 260, "300 мл", []string{"хит"}, "coffee", 10),
		menuSeed("mountain-tea", "drinks", "Горный чай", "Душистый травяной сбор с медовым послевкусием.", 220, "450 мл", []string{"без кофеина"}, "tea", 20),
		menuSeed("berry-lemonade", "drinks", "Ягодный лимонад", "Смородина, мята, цитрус и много льда.", 280, "400 мл", []string{"холодный"}, "lemonade", 30),
	}
	for _, item := range items {
		var existing models.MenuItem
		db.Where("slug = ?", item.Slug).FirstOrCreate(&existing, item)
		existing.CategoryID = item.CategoryID
		existing.Name = item.Name
		existing.Description = item.Description
		existing.Price = item.Price
		existing.Weight = item.Weight
		existing.Badges = item.Badges
		existing.Image = item.Image
		existing.Available = item.Available
		existing.SortOrder = item.SortOrder
		db.Save(&existing)
	}

	password, _ := bcrypt.GenerateFromPassword([]byte("chambu-admin"), bcrypt.DefaultCost)
	db.FirstOrCreate(&models.Admin{}, models.Admin{
		Name:         "ChamBu Admin",
		Email:        "admin@chambu.local",
		PasswordHash: string(password),
		Role:         "owner",
	})
}
func menuSeed(slug, categoryID, name, description string, price int64, weight string, badges []string, image string, sortOrder int) models.MenuItem {
	rawBadges, _ := json.Marshal(badges)
	return models.MenuItem{
		Slug:        slug,
		CategoryID:  categoryID,
		Name:        name,
		Description: description,
		Price:       price,
		Weight:      weight,
		Badges:      datatypes.JSON(rawBadges),
		Image:       image,
		Available:   true,
		SortOrder:   sortOrder,
	}
}

func buildStorage(cfg config.Config) storage.Storage {
	if cfg.Storage == "cloudinary" && cfg.CloudName != "" && cfg.CloudKey != "" && cfg.CloudSecret != "" {
		store, err := storage.NewCloudinaryStorage(cfg.CloudName, cfg.CloudKey, cfg.CloudSecret)
		if err == nil {
			return store
		}
		log.Printf("cloudinary disabled: %v", err)
	}
	return storage.NewYandexStorage(cfg.YandexToken)
}
