package repository

import (
	"chambu/server/internal/models"
	"errors"

	"gorm.io/gorm"
)

type OrderRepository interface {
	GetAll(limit, offset int) ([]models.Order, int64, error)
	GetByID(id uint) (*models.Order, error)

	Create(order *models.Order) error
	Delete(id uint) error

	CreateOrderItem(orderItem *models.OrderItem) error

	WithTx(tx *gorm.DB) OrderRepository
	Transaction(fn func(r OrderRepository) error) error
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) WithTx(tx *gorm.DB) OrderRepository {
	return &orderRepository{db: tx}
}

func (r *orderRepository) GetAll(limit, offset int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	base := r.db.Model(&models.Order{})

	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := base.
		Preload("Items").
		Preload("Items.MenuItem").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error; err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (r *orderRepository) GetByID(id uint) (*models.Order, error) {
	var order models.Order

	if err := r.db.
		Preload("Items").
		Preload("Items.MenuItem").
		First(&order, id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}

		return nil, err
	}

	return &order, nil
}

func (r *orderRepository) Create(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *orderRepository) Delete(id uint) error {
	return r.db.Delete(&models.Order{}, id).Error
}

func (r *orderRepository) CreateOrderItem(orderItem *models.OrderItem) error {
	return r.db.Create(orderItem).Error
}

func (r *orderRepository) Transaction(fn func(r OrderRepository) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		txRepo := r.WithTx(tx)
		return fn(txRepo)
	})
}
