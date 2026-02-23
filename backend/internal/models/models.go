package models

import (
	"gorm.io/gorm"
)

// Base contains common fields for all models
type Base struct {
	gorm.Model
}

// Example model for benchmarking
type Item struct {
	gorm.Model
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
}
