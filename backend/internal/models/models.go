package models

import (
	"gorm.io/gorm"
)

// Base contains common fields for all models
type Base struct {
	gorm.Model
}

// Item represents a product/item in the system
type Item struct {
	gorm.Model
	Name        string  `gorm:"not null" json:"name"`
	Description string  `json:"description"`
	Price       float64 `gorm:"not null" json:"price"`
	SKU         string  `gorm:"unique" json:"sku"`
	CategoryID  uint    `json:"categoryId"`
}
