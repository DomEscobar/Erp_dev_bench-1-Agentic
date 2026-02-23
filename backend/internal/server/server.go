package server

import (
	"fmt"
	"log"
	
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/DomEscobar/erp-dev-bench/internal/config"
	"github.com/DomEscobar/erp-dev-bench/internal/handlers"
	"github.com/DomEscobar/erp-dev-bench/internal/middleware"
	"github.com/DomEscobar/erp-dev-bench/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Start(cfg *config.Config) {
	// Initialize database
	db, err := gorm.Open(sqlite.Open("erp.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	
	// Auto migrate
	db.AutoMigrate(&models.User{}, &models.Product{}, &models.Order{})
	
	// Setup Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	r := gin.Default()
	
	// CORS middleware
	r.Use(cors.Default())
	
	// Logger middleware
	r.Use(middleware.Logger())
	
	// Routes
	api := r.Group("/api/v1")
	{
		api.GET("/health", handlers.HealthCheck)
		
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register(db))
			auth.POST("/login", handlers.Login(db, cfg.JWTSecret))
		}
		
		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			protected.GET("/users", handlers.ListUsers(db))
			protected.GET("/products", handlers.ListProducts(db))
		}
	}
	
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", addr)
	log.Fatal(r.Run(addr))
}
