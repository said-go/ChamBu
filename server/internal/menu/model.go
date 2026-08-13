package menu

type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Item struct {
	ID          string   `json:"id"`
	CategoryID  string   `json:"categoryId"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int      `json:"price"`
	Weight      string   `json:"weight"`
	Badges      []string `json:"badges"`
	Image       string   `json:"image"`
	Available   bool     `json:"available"`
}

type Catalog struct {
	Brand      BrandInfo  `json:"brand"`
	Categories []Category `json:"categories"`
	Items      []Item     `json:"items"`
}

type BrandInfo struct {
	Name        string   `json:"name"`
	Subtitle    string   `json:"subtitle"`
	Description string   `json:"description"`
	Phone       string   `json:"phone"`
	Address     string   `json:"address"`
	Hours       string   `json:"hours"`
	Highlights  []string `json:"highlights"`
}

type Repository interface {
	Catalog() Catalog
}

type AdminRepository interface {
	Repository
	UpsertCategory(Category) error
	DeleteCategory(id string) error
	UpsertItem(Item) error
	DeleteItem(id string) error
}
