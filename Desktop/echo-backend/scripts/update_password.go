package main

import (
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/models"
	"backend/pkg/auth"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Update password for admin user
	email := "reaganprezzo@gmail.com"
	newPassword := "Admin@5607!"

	if err := updateUserPassword(db, email, newPassword); err != nil {
		log.Fatalf("Failed to update password: %v", err)
	}

	fmt.Printf("Successfully updated password for %s!\n", email)
}

func updateUserPassword(db *gorm.DB, email, newPassword string) error {
	// Hash the new password
	hashedPassword, err := auth.HashPassword(newPassword, 12)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update the user's password
	result := db.Model(&models.User{}).Where("email = ?", email).Update("password", hashedPassword)
	if result.Error != nil {
		return fmt.Errorf("failed to update password: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with email %s not found", email)
	}

	log.Printf("Updated password for user %s", email)
	return nil
}

