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

func TestItemModel(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	
	db.AutoMigrate(&models.Item{})
	
	item := models.Item{
		Name:        "Test Item",
		Description: "A test item",
	}
	
	result := db.Create(&item)
	assert.NoError(t, result.Error)
	assert.NotZero(t, item.ID)
}
