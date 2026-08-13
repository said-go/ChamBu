package menu

type StaticRepository struct {
	catalog Catalog
}

func NewStaticRepository() StaticRepository {
	return StaticRepository{catalog: Catalog{
		Brand: BrandInfo{
			Name:        "ЧамБу",
			Subtitle:    "Кофе, завтраки и десерты в Грозном",
			Description: "Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.",
			Phone:       "+7 938 994-88-00",
			Address:     "Грозный, ул. Хамзата Орзамиева, 30/30А",
			Hours:       "Ежедневно 08:00-22:00",
			Highlights:  []string{"с собой", "завтраки весь день", "свежая выпечка"},
		},
		Categories: []Category{
			{ID: "coffee", Name: "Кофе", Description: "Классика, авторские напитки и мягкие молочные вкусы."},
			{ID: "tea", Name: "Чай и лимонады", Description: "Согревающие сборы, холодные напитки и домашние вкусы."},
			{ID: "breakfast", Name: "Завтраки", Description: "Сытные позиции для утра и позднего старта."},
			{ID: "desserts", Name: "Десерты", Description: "Нежные сладости к кофе и праздничному настроению."},
		},
		Items: []Item{
			{ID: "raf-cardamom", CategoryID: "coffee", Name: "Раф кардамон", Description: "Сливочный кофе с тонкой пряной нотой и бархатной пеной.", Price: 260, Weight: "300 мл", Badges: []string{"хит", "нежный"}, Image: "coffee", Available: true},
			{ID: "latte-honey", CategoryID: "coffee", Name: "Латте медовый", Description: "Эспрессо, молоко и мягкая сладость меда без лишней тяжести.", Price: 240, Weight: "300 мл", Badges: []string{"мягкий"}, Image: "latte", Available: true},
			{ID: "americano", CategoryID: "coffee", Name: "Американо", Description: "Чистый вкус зерна, плотный аромат и аккуратная горчинка.", Price: 160, Weight: "250 мл", Badges: []string{"классика"}, Image: "americano", Available: true},
			{ID: "mountain-tea", CategoryID: "tea", Name: "Горный чай", Description: "Душистый травяной сбор с медовым послевкусием.", Price: 220, Weight: "450 мл", Badges: []string{"без кофеина"}, Image: "tea", Available: true},
			{ID: "berry-lemonade", CategoryID: "tea", Name: "Ягодный лимонад", Description: "Смородина, мята, цитрус и много льда.", Price: 280, Weight: "400 мл", Badges: []string{"холодный"}, Image: "lemonade", Available: true},
			{ID: "shakshuka", CategoryID: "breakfast", Name: "Шакшука с сыром", Description: "Яйца в томатном соусе, зелень, сыр и теплый хлеб.", Price: 390, Weight: "320 г", Badges: []string{"сытно"}, Image: "breakfast", Available: true},
			{ID: "croissant-salmon", CategoryID: "breakfast", Name: "Круассан с лососем", Description: "Хрустящий круассан, сливочный сыр, лосось и свежий огурец.", Price: 430, Weight: "210 г", Badges: []string{"премиум"}, Image: "croissant", Available: true},
			{ID: "syrniki", CategoryID: "breakfast", Name: "Сырники", Description: "Творожные сырники со сметаной и ягодным соусом.", Price: 340, Weight: "240 г", Badges: []string{"сладкое"}, Image: "syrniki", Available: true},
			{ID: "pistachio-roll", CategoryID: "desserts", Name: "Фисташковый рулет", Description: "Воздушный бисквит, крем и фисташковая крошка.", Price: 310, Weight: "140 г", Badges: []string{"новинка"}, Image: "dessert", Available: true},
			{ID: "tiramisu", CategoryID: "desserts", Name: "Тирамису", Description: "Кофейный десерт с маскарпоне и какао.", Price: 320, Weight: "150 г", Badges: []string{"к кофе"}, Image: "tiramisu", Available: true},
		},
	}}
}

func (r StaticRepository) Catalog() Catalog {
	return r.catalog
}
