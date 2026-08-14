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
	highlights, _ := json.Marshal([]string{"СЃ СЃРѕР±РѕР№", "Р·Р°РІС‚СЂР°РєРё РІРµСЃСЊ РґРµРЅСЊ", "СЃРІРµР¶Р°СЏ РІС‹РїРµС‡РєР°"})
	db.FirstOrCreate(&models.BrandSettings{}, models.BrandSettings{
		ID:          1,
		Name:        "Р§Р°РјР‘Сѓ",
		Subtitle:    "РљРѕС„Рµ, Р·Р°РІС‚СЂР°РєРё Рё РґРµСЃРµСЂС‚С‹ РІ Р“СЂРѕР·РЅРѕРј",
		Description: "РўРµРїР»РѕРµ РјРµРЅСЋ РґР»СЏ Р±С‹СЃС‚СЂС‹С… Р·Р°РІС‚СЂР°РєРѕРІ, СЃРїРѕРєРѕР№РЅС‹С… РІСЃС‚СЂРµС‡ Рё СЃР»Р°РґРєРёС… РїР°СѓР·.",
		Phone:       "+7 938 994-88-00",
		Address:     "Р“СЂРѕР·РЅС‹Р№, СѓР». РҐР°РјР·Р°С‚Р° РћСЂР·Р°РјРёРµРІР°, 30/30Рђ",
		Hours:       "Р•Р¶РµРґРЅРµРІРЅРѕ 08:00-22:00",
		Highlights:  datatypes.JSON(highlights),
	})

	categories := []models.MenuCategory{
		{Slug: "coffee", Name: "РљРѕС„Рµ", Description: "РљР»Р°СЃСЃРёРєР°, Р°РІС‚РѕСЂСЃРєРёРµ РЅР°РїРёС‚РєРё Рё РјСЏРіРєРёРµ РјРѕР»РѕС‡РЅС‹Рµ РІРєСѓСЃС‹.", SortOrder: 10},
		{Slug: "tea", Name: "Р§Р°Р№ Рё Р»РёРјРѕРЅР°РґС‹", Description: "РЎРѕРіСЂРµРІР°СЋС‰РёРµ СЃР±РѕСЂС‹, С…РѕР»РѕРґРЅС‹Рµ РЅР°РїРёС‚РєРё Рё РґРѕРјР°С€РЅРёРµ РІРєСѓСЃС‹.", SortOrder: 20},
		{Slug: "breakfast", Name: "Р—Р°РІС‚СЂР°РєРё", Description: "РЎС‹С‚РЅС‹Рµ РїРѕР·РёС†РёРё РґР»СЏ СѓС‚СЂР° Рё РїРѕР·РґРЅРµРіРѕ СЃС‚Р°СЂС‚Р°.", SortOrder: 30},
		{Slug: "desserts", Name: "Р”РµСЃРµСЂС‚С‹", Description: "РќРµР¶РЅС‹Рµ СЃР»Р°РґРѕСЃС‚Рё Рє РєРѕС„Рµ Рё РїСЂР°Р·РґРЅРёС‡РЅРѕРјСѓ РЅР°СЃС‚СЂРѕРµРЅРёСЋ.", SortOrder: 40},
	}
	for _, category := range categories {
		db.FirstOrCreate(&models.MenuCategory{}, models.MenuCategory{Slug: category.Slug, Name: category.Name, Description: category.Description, SortOrder: category.SortOrder})
	}

	items := []models.MenuItem{
		menuSeed("raf-cardamom", "coffee", "Р Р°С„ РєР°СЂРґР°РјРѕРЅ", "РЎР»РёРІРѕС‡РЅС‹Р№ РєРѕС„Рµ СЃ С‚РѕРЅРєРѕР№ РїСЂСЏРЅРѕР№ РЅРѕС‚РѕР№ Рё Р±Р°СЂС…Р°С‚РЅРѕР№ РїРµРЅРѕР№.", 260, "300 РјР»", []string{"С…РёС‚", "РЅРµР¶РЅС‹Р№"}, "coffee", 10),
		menuSeed("latte-honey", "coffee", "Р›Р°С‚С‚Рµ РјРµРґРѕРІС‹Р№", "Р­СЃРїСЂРµСЃСЃРѕ, РјРѕР»РѕРєРѕ Рё РјСЏРіРєР°СЏ СЃР»Р°РґРѕСЃС‚СЊ РјРµРґР° Р±РµР· Р»РёС€РЅРµР№ С‚СЏР¶РµСЃС‚Рё.", 240, "300 РјР»", []string{"РјСЏРіРєРёР№"}, "latte", 20),
		menuSeed("americano", "coffee", "РђРјРµСЂРёРєР°РЅРѕ", "Р§РёСЃС‚С‹Р№ РІРєСѓСЃ Р·РµСЂРЅР°, РїР»РѕС‚РЅС‹Р№ Р°СЂРѕРјР°С‚ Рё Р°РєРєСѓСЂР°С‚РЅР°СЏ РіРѕСЂС‡РёРЅРєР°.", 160, "250 РјР»", []string{"РєР»Р°СЃСЃРёРєР°"}, "americano", 30),
		menuSeed("mountain-tea", "tea", "Р“РѕСЂРЅС‹Р№ С‡Р°Р№", "Р”СѓС€РёСЃС‚С‹Р№ С‚СЂР°РІСЏРЅРѕР№ СЃР±РѕСЂ СЃ РјРµРґРѕРІС‹Рј РїРѕСЃР»РµРІРєСѓСЃРёРµРј.", 220, "450 РјР»", []string{"Р±РµР· РєРѕС„РµРёРЅР°"}, "tea", 10),
		menuSeed("berry-lemonade", "tea", "РЇРіРѕРґРЅС‹Р№ Р»РёРјРѕРЅР°Рґ", "РЎРјРѕСЂРѕРґРёРЅР°, РјСЏС‚Р°, С†РёС‚СЂСѓСЃ Рё РјРЅРѕРіРѕ Р»СЊРґР°.", 280, "400 РјР»", []string{"С…РѕР»РѕРґРЅС‹Р№"}, "lemonade", 20),
		menuSeed("shakshuka", "breakfast", "РЁР°РєС€СѓРєР° СЃ СЃС‹СЂРѕРј", "РЇР№С†Р° РІ С‚РѕРјР°С‚РЅРѕРј СЃРѕСѓСЃРµ, Р·РµР»РµРЅСЊ, СЃС‹СЂ Рё С‚РµРїР»С‹Р№ С…Р»РµР±.", 390, "320 Рі", []string{"СЃС‹С‚РЅРѕ"}, "breakfast", 10),
		menuSeed("croissant-salmon", "breakfast", "РљСЂСѓР°СЃСЃР°РЅ СЃ Р»РѕСЃРѕСЃРµРј", "РҐСЂСѓСЃС‚СЏС‰РёР№ РєСЂСѓР°СЃСЃР°РЅ, СЃР»РёРІРѕС‡РЅС‹Р№ СЃС‹СЂ, Р»РѕСЃРѕСЃСЊ Рё СЃРІРµР¶РёР№ РѕРіСѓСЂРµС†.", 430, "210 Рі", []string{"РїСЂРµРјРёСѓРј"}, "croissant", 20),
		menuSeed("syrniki", "breakfast", "РЎС‹СЂРЅРёРєРё", "РўРІРѕСЂРѕР¶РЅС‹Рµ СЃС‹СЂРЅРёРєРё СЃРѕ СЃРјРµС‚Р°РЅРѕР№ Рё СЏРіРѕРґРЅС‹Рј СЃРѕСѓСЃРѕРј.", 340, "240 Рі", []string{"СЃР»Р°РґРєРѕРµ"}, "syrniki", 30),
		menuSeed("pistachio-roll", "desserts", "Р¤РёСЃС‚Р°С€РєРѕРІС‹Р№ СЂСѓР»РµС‚", "Р’РѕР·РґСѓС€РЅС‹Р№ Р±РёСЃРєРІРёС‚, РєСЂРµРј Рё С„РёСЃС‚Р°С€РєРѕРІР°СЏ РєСЂРѕС€РєР°.", 310, "140 Рі", []string{"РЅРѕРІРёРЅРєР°"}, "dessert", 10),
		menuSeed("tiramisu", "desserts", "РўРёСЂР°РјРёСЃСѓ", "РљРѕС„РµР№РЅС‹Р№ РґРµСЃРµСЂС‚ СЃ РјР°СЃРєР°СЂРїРѕРЅРµ Рё РєР°РєР°Рѕ.", 320, "150 Рі", []string{"Рє РєРѕС„Рµ"}, "tiramisu", 20),
	}
	for _, item := range items {
		db.FirstOrCreate(&models.MenuItem{}, models.MenuItem{Slug: item.Slug, CategoryID: item.CategoryID, Name: item.Name, Description: item.Description, Price: item.Price, Weight: item.Weight, Badges: item.Badges, Image: item.Image, Available: item.Available, SortOrder: item.SortOrder})
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
