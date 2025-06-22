package config

import (
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	Database DatabaseConfig
	JWT      JWTConfig
	Server   ServerConfig
	Security SecurityConfig
	Logging  LoggingConfig
	Paystack struct {
        SecretKey string `mapstructure:"secret_key"`
    } `mapstructure:"paystack"`
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret      string
	ExpiryHours int
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type SecurityConfig struct {
	BcryptCost int
}

type LoggingConfig struct {
	Level  string
	Format string
}

func Load() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", 5432)
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("GIN_MODE", "debug")
	viper.SetDefault("BCRYPT_COST", 12)
	viper.SetDefault("JWT_EXPIRY_HOURS", 24)
	viper.SetDefault("LOG_LEVEL", "info")
	viper.SetDefault("LOG_FORMAT", "json")

	config := &Config{
		Database: DatabaseConfig{
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetInt("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			Name:     viper.GetString("DB_NAME"),
			SSLMode:  viper.GetString("DB_SSLMODE"),
		},
		JWT: JWTConfig{
			Secret:      viper.GetString("JWT_SECRET"),
			ExpiryHours: viper.GetInt("JWT_EXPIRY_HOURS"),
		},
		Server: ServerConfig{
			Port:    viper.GetString("PORT"),
			GinMode: viper.GetString("GIN_MODE"),
		},
		Security: SecurityConfig{
			BcryptCost: viper.GetInt("BCRYPT_COST"),
		},
		Logging: LoggingConfig{
			Level:  viper.GetString("LOG_LEVEL"),
			Format: viper.GetString("LOG_FORMAT"),
		},
	}

	// Validate required fields
	if config.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	if config.Database.User == "" {
		return nil, fmt.Errorf("DB_USER is required")
	}
	if config.Database.Name == "" {
		return nil, fmt.Errorf("DB_NAME is required")
	}

	return config, nil
}

func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

func (c *Config) GetJWTExpiry() time.Duration {
	return time.Duration(c.JWT.ExpiryHours) * time.Hour
}

