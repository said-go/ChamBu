package menu

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) PostgresRepository {
	return PostgresRepository{db: db}
}

func (r PostgresRepository) Catalog() Catalog {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	brand, err := r.brand(ctx)
	if err != nil {
		return NewStaticRepository().Catalog()
	}

	categories, err := r.categories(ctx)
	if err != nil {
		return NewStaticRepository().Catalog()
	}

	items, err := r.items(ctx)
	if err != nil {
		return NewStaticRepository().Catalog()
	}

	return Catalog{Brand: brand, Categories: categories, Items: items}
}

func (r PostgresRepository) brand(ctx context.Context) (BrandInfo, error) {
	var brand BrandInfo
	var highlights []byte
	err := r.db.QueryRowContext(ctx, `
		select name, subtitle, description, phone, address, hours, highlights
		from brand_settings
		where id = 1
	`).Scan(&brand.Name, &brand.Subtitle, &brand.Description, &brand.Phone, &brand.Address, &brand.Hours, &highlights)
	if err != nil {
		return BrandInfo{}, err
	}
	if err := json.Unmarshal(highlights, &brand.Highlights); err != nil {
		return BrandInfo{}, err
	}
	return brand, nil
}

func (r PostgresRepository) categories(ctx context.Context) ([]Category, error) {
	rows, err := r.db.QueryContext(ctx, `
		select id, name, description
		from menu_categories
		order by sort_order, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var category Category
		if err := rows.Scan(&category.ID, &category.Name, &category.Description); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, rows.Err()
}

func (r PostgresRepository) items(ctx context.Context) ([]Item, error) {
	rows, err := r.db.QueryContext(ctx, `
		select id, category_id, name, description, price, weight, badges, image, available
		from menu_items
		order by sort_order, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Item
	for rows.Next() {
		var item Item
		var badges []byte
		if err := rows.Scan(&item.ID, &item.CategoryID, &item.Name, &item.Description, &item.Price, &item.Weight, &badges, &item.Image, &item.Available); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(badges, &item.Badges); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r PostgresRepository) UpsertCategory(category Category) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, `
		insert into menu_categories (id, name, description)
		values ($1, $2, $3)
		on conflict (id) do update set
			name = excluded.name,
			description = excluded.description,
			updated_at = now()
	`, category.ID, category.Name, category.Description)
	return err
}

func (r PostgresRepository) DeleteCategory(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err := r.db.ExecContext(ctx, `delete from menu_categories where id = $1`, id)
	return err
}

func (r PostgresRepository) UpsertItem(item Item) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	badges, err := json.Marshal(item.Badges)
	if err != nil {
		return fmt.Errorf("marshal badges: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		insert into menu_items (id, category_id, name, description, price, weight, badges, image, available)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		on conflict (id) do update set
			category_id = excluded.category_id,
			name = excluded.name,
			description = excluded.description,
			price = excluded.price,
			weight = excluded.weight,
			badges = excluded.badges,
			image = excluded.image,
			available = excluded.available,
			updated_at = now()
	`, item.ID, item.CategoryID, item.Name, item.Description, item.Price, item.Weight, badges, item.Image, item.Available)
	return err
}

func (r PostgresRepository) DeleteItem(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err := r.db.ExecContext(ctx, `delete from menu_items where id = $1`, id)
	return err
}
