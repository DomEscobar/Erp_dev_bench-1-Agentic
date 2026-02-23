package integration

import (
	"testing"
	
	"github.com/DomEscobar/erp-dev-bench/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestDatabaseConnection(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	assert.NotNil(t, db)
}

func TestUserModel(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	
	db.AutoMigrate(&models.User{})
	
	user := models.User{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "hashedpassword",
		Role:     "user",
	}
	
	result := db.Create(&user)
	assert.NoError(t, result.Error)
	assert.NotZero(t, user.ID)
}

func TestProductModel(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	
	db.AutoMigrate(&models.Product{})
	
	product := models.Product{
		Name:        "Test Product",
		Description: "A test product",
		Price:       29.99,
		SKU:         "TEST-001",
		Stock:       100,
	}
	
	result := db.Create(&product)
	assert.NoError(t, result.Error)
	assert.NotZero(t, product.ID)
}
