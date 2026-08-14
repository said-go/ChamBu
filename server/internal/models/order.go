package models

import "gorm.io/gorm"

type Order struct {
	gorm.Model

	CustomerName    string      `json:"customer_name" gorm:"not null"`
	ContactMethod   uint        `json:"contact_method" gorm:"not null"`
	Phone           string      `json:"phone"`
	City            string      `json:"city"`
	DeliveryAddress string      `json:"delivery_address"`
	Status          string      `json:"status" gorm:"not null;default:'new'"`
	Comment         string      `json:"comment"`
	TotalPrice      int64       `json:"total_price" gorm:"not null;default:0"`
	Items           []OrderItem `json:"items" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

//
// DTO (create request)
//

type OrderCreate struct {
	CustomerName    string            `json:"customer_name" binding:"required"`
	ContactMethod   uint              `json:"contact_method" binding:"required"`
	Phone           string            `json:"phone" binding:"required"`
	City            string            `json:"city" binding:"required"`
	DeliveryAddress string            `json:"delivery_address" binding:"required"`
	Comment         string            `json:"comment"`
	Items           []OrderItemCreate `json:"items" binding:"required"`
}

const (
	ContactTelegram  uint = 1
	ContactInstagram uint = 2
	ContactPhone     uint = 3
)

const (
	OrderStatusNew        = "new"
	OrderStatusConfirmed  = "confirmed"
	OrderStatusAssembling = "assembling"
	OrderStatusShipped    = "shipped"
	OrderStatusCompleted  = "completed"
	OrderStatusCancelled  = "cancelled"
)
