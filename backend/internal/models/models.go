package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email     string `gorm:"uniqueIndex;not null" json:"email"`
	Name      string `json:"name"`
	Password  string `gorm:"not null" json:"-"`
	Role      string `gorm:"default:'user'" json:"role"`
}

type Product struct {
	gorm.Model
	Name        string  `gorm:"not null" json:"name"`
	Description string  `json:"description"`
	Price       float64 `gorm:"not null" json:"price"`
	SKU         string  `gorm:"uniqueIndex" json:"sku"`
	Stock       int     `gorm:"default:0" json:"stock"`
}

type Order struct {
	gorm.Model
	UserID      uint      `gorm:"not null" json:"user_id"`
	User        User      `json:"user"`
	Total       float64   `json:"total"`
	Status      string    `gorm:"default:'pending'" json:"status"`
	OrderDate   time.Time `json:"order_date"`
}
