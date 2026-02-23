package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	
	"github.com/DomEscobar/erp-dev-bench/internal/handlers"
	"github.com/DomEscobar/erp-dev-bench/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&models.User{}, &models.Product{}, &models.Order{})
	return db
}

func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handlers.HealthCheck(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRegister(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	
	router := gin.New()
	router.POST("/register", handlers.Register(db))
	
	body := map[string]string{
		"email":    "test@example.com",
		"name":     "Test User",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)
	
	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestRegister_DuplicateEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	
	router := gin.New()
	router.POST("/register", handlers.Register(db))
	
	body := map[string]string{
		"email":    "test@example.com",
		"name":     "Test User",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)
	
	// First request
	req1 := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	
	// Second request with same email
	req2 := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	
	assert.Equal(t, http.StatusConflict, w2.Code)
}
