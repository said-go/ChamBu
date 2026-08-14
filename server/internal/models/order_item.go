package models

import "gorm.io/gorm"

type OrderItem struct {
	gorm.Model

	OrderID    uint     `json:"order_id" gorm:"index"`
	MenuItemID uint     `json:"menu_item_id" gorm:"not null"`
	MenuItem   MenuItem `json:"menu_item" gorm:"foreignKey:MenuItemID"`

	Quantity uint `json:"quantity" gorm:"not null"`

	UnitPrice  int64 `json:"unit_price" gorm:"not null"`
	TotalPrice int64 `json:"total_price" gorm:"not null"`
}

type OrderItemCreate struct {
	MenuItemID uint `json:"menu_item_id" binding:"required"`
	Quantity   uint `json:"quantity" binding:"required,min=1"`
}
