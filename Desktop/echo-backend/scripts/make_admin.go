package main

import (
	"errors"
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

	// Make user admin
	email := "reaganprezzo@gmail.com"
	password := "Admin@5607!"

	if err := makeUserAdmin(db, email, password); err != nil {
		log.Fatalf("Failed to make user admin: %v", err)
	}

	fmt.Printf("Successfully made %s an admin user!\n", email)
}

func makeUserAdmin(db *gorm.DB, email, password string) error {
	// Check if user already exists
	var existingUser models.User
	result := db.Preload("Profile").Where("email = ?", email).First(&existingUser)
	
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// User doesn't exist, create new admin user
		log.Printf("User %s not found, creating new admin user", email)
		return createNewAdminUser(db, email, password)
	} else if result.Error != nil {
		// Other database error
		return fmt.Errorf("failed to check for existing user: %w", result.Error)
	}

	// User exists, update their role to admin
	log.Printf("User %s found, updating role to admin", email)
	return updateUserToAdmin(db, &existingUser)
}

func createNewAdminUser(db *gorm.DB, email, password string) error {
	// Hash password
	hashedPassword, err := auth.HashPassword(password, 12)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Create admin user with profile
	admin := &models.User{
		Email:    email,
		Password: hashedPassword,
		Role:     models.RoleAdmin,
		IsActive: true,
		Profile: models.UserProfile{
			FirstName: "Reagan",
			LastName:  "Prezzo",
		},
	}

	if err := db.Create(admin).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	log.Printf("Created new admin user: %s", email)
	return nil
}

func updateUserToAdmin(db *gorm.DB, user *models.User) error {
	// Update user role to admin and ensure they're active
	result := db.Model(user).Updates(map[string]interface{}{
		"role":      models.RoleAdmin,
		"is_active": true,
	})

	if result.Error != nil {
		return fmt.Errorf("failed to update user role: %w", result.Error)
	}

	// If user doesn't have a profile, create one
	if user.Profile.ID == 0 {
		profile := models.UserProfile{
			UserID:    user.ID,
			FirstName: "Reagan",
			LastName:  "Prezzo",
		}
		if err := db.Create(&profile).Error; err != nil {
			return fmt.Errorf("failed to create user profile: %w", err)
		}
		log.Printf("Created profile for user %s", user.Email)
	}

	log.Printf("Updated user %s to admin role", user.Email)
	return nil
}

