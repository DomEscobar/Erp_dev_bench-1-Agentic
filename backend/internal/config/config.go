package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Port        string `mapstructure:"PORT"`
	DatabaseURL string `mapstructure:"DATABASE_URL"`
	Environment string `mapstructure:"ENVIRONMENT"`
	JWTSecret   string `mapstructure:"JWT_SECRET"`
}

func Load() *Config {
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENVIRONMENT", "development")
	viper.SetDefault("DATABASE_URL", "file:erp.db")
	viper.SetDefault("JWT_SECRET", "your-secret-key")
	
	viper.AutomaticEnv()
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	
	_ = viper.ReadInConfig()
	
	return &Config{
		Port:        viper.GetString("PORT"),
		DatabaseURL: viper.GetString("DATABASE_URL"),
		Environment: viper.GetString("ENVIRONMENT"),
		JWTSecret:   viper.GetString("JWT_SECRET"),
	}
}
