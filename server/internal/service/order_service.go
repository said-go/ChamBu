package service

import (
	"fmt"

	"chambu/server/internal/models"
	"chambu/server/internal/repository"
)

type OrderService interface {
	List(page, limit int) ([]models.Order, int64, error)
	Get(id uint) (*models.Order, error)
	Create(input *models.OrderCreate) (*models.Order, error)
	Delete(id uint) error
}

type orderService struct {
	repo     repository.OrderRepository
	menuRepo repository.MenuRepository
}

func NewOrderService(
	repo repository.OrderRepository,
	menuRepo repository.MenuRepository,
) OrderService {
	return &orderService{
		repo:     repo,
		menuRepo: menuRepo,
	}
}

func (s *orderService) List(page, limit int) ([]models.Order, int64, error) {

	offset := (page - 1) * limit

	return s.repo.GetAll(limit, offset)
}

func (s *orderService) Get(id uint) (*models.Order, error) {
	return s.repo.GetByID(id)
}

func (s *orderService) Create(input *models.OrderCreate) (*models.Order, error) {

	order := buildOrder(input)

	items, total, err := s.buildOrderItems(input.Items)
	if err != nil {
		return nil, err
	}

	order.Items = items
	order.TotalPrice = total

	err = s.repo.Transaction(func(r repository.OrderRepository) error {

		if err := r.Create(order); err != nil {
			return err
		}

		for i := range items {
			items[i].OrderID = order.ID
			if err := r.CreateOrderItem(&items[i]); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return order, nil
}

func buildOrder(input *models.OrderCreate) *models.Order {
	return &models.Order{
		CustomerName:    input.CustomerName,
		ContactMethod:   input.ContactMethod,
		Phone:           input.Phone,
		City:            input.City,
		DeliveryAddress: input.DeliveryAddress,
		Comment:         input.Comment,
		Status:          "new",
	}
}

func (s *orderService) buildOrderItems(
	inputItems []models.OrderItemCreate,
) ([]models.OrderItem, int64, error) {

	var (
		items []models.OrderItem
		total int64
	)

	for _, in := range inputItems {

		item, err := s.menuRepo.GetByID(in.MenuItemID)
		if err != nil {
			return nil, 0, err
		}
		if item == nil {
			return nil, 0, fmt.Errorf("menu item %d not found", in.MenuItemID)
		}

		unitPrice := item.Price
		itemTotal := unitPrice * int64(in.Quantity)

		items = append(items, models.OrderItem{
			MenuItemID: item.ID,
			Quantity:   in.Quantity,
			UnitPrice:  unitPrice,
			TotalPrice: itemTotal,
		})

		total += itemTotal
	}

	return items, total, nil
}

func (s *orderService) Delete(id uint) error {
	return s.repo.Delete(id)
}
