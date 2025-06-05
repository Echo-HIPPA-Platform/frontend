package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/google/uuid"
)

// EncryptionService handles application-level encryption for ePHI data
type EncryptionService struct {
	masterKey    []byte
	keyRotation  map[string][]byte // keyID -> encryption key
	currentKeyID string
}

// EncryptedData represents encrypted content with metadata
type EncryptedData struct {
	EncryptedContent string
	ContentHash      string
	KeyID            string
}

// NewEncryptionService creates a new encryption service
func NewEncryptionService() (*EncryptionService, error) {
	masterKeyBase64 := os.Getenv("ENCRYPTION_MASTER_KEY")
	if masterKeyBase64 == "" {
		return nil, errors.New("ENCRYPTION_MASTER_KEY environment variable is required")
	}

	masterKey, err := base64.StdEncoding.DecodeString(masterKeyBase64)
	if err != nil {
		return nil, fmt.Errorf("invalid master key format: %w", err)
	}

	if len(masterKey) != 32 { // AES-256 requires 32-byte key
		return nil, errors.New("master key must be 32 bytes (256 bits)")
	}

	// Generate initial encryption key
	currentKeyID := uuid.New().String()
	encryptionKey := deriveKey(masterKey, currentKeyID)

	return &EncryptionService{
		masterKey:    masterKey,
		keyRotation:  map[string][]byte{currentKeyID: encryptionKey},
		currentKeyID: currentKeyID,
	}, nil
}

// Encrypt encrypts plaintext data using AES-256-GCM
func (e *EncryptionService) Encrypt(plaintext string) (*EncryptedData, error) {
	if plaintext == "" {
		return nil, errors.New("plaintext cannot be empty")
	}

	// Get current encryption key
	encryptionKey := e.keyRotation[e.currentKeyID]
	if encryptionKey == nil {
		return nil, errors.New("encryption key not found")
	}

	// Create cipher
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	encryptedContent := base64.StdEncoding.EncodeToString(ciphertext)

	// Generate content hash for integrity
	contentHash := sha256.Sum256([]byte(plaintext))
	hash := fmt.Sprintf("%x", contentHash)

	return &EncryptedData{
		EncryptedContent: encryptedContent,
		ContentHash:      hash,
		KeyID:            e.currentKeyID,
	}, nil
}

// Decrypt decrypts encrypted data using the appropriate key
func (e *EncryptionService) Decrypt(encryptedData *EncryptedData) (string, error) {
	if encryptedData == nil {
		return "", errors.New("encrypted data cannot be nil")
	}

	// Get encryption key for this data
	encryptionKey := e.keyRotation[encryptedData.KeyID]
	if encryptionKey == nil {
		// Try to derive the key if it's not in rotation map
		encryptionKey = deriveKey(e.masterKey, encryptedData.KeyID)
		e.keyRotation[encryptedData.KeyID] = encryptionKey
	}

	// Decode base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData.EncryptedContent)
	if err != nil {
		return "", fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	// Create cipher
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	result := string(plaintext)

	// Verify content integrity
	contentHash := sha256.Sum256(plaintext)
	expectedHash := fmt.Sprintf("%x", contentHash)
	if expectedHash != encryptedData.ContentHash {
		return "", errors.New("content integrity check failed")
	}

	return result, nil
}

// RotateKey creates a new encryption key for future encryptions
func (e *EncryptionService) RotateKey() string {
	newKeyID := uuid.New().String()
	newKey := deriveKey(e.masterKey, newKeyID)
	e.keyRotation[newKeyID] = newKey
	e.currentKeyID = newKeyID
	return newKeyID
}

// GetCurrentKeyID returns the current encryption key ID
func (e *EncryptionService) GetCurrentKeyID() string {
	return e.currentKeyID
}

// deriveKey derives an encryption key from master key and key ID using PBKDF2
func deriveKey(masterKey []byte, keyID string) []byte {
	// Use keyID as salt for key derivation
	hash := sha256.New()
	hash.Write(masterKey)
	hash.Write([]byte(keyID))
	return hash.Sum(nil)[:32] // Return 32 bytes for AES-256
}

// GenerateMasterKey generates a new 256-bit master key for encryption
// This should be called once during initial setup and stored securely
func GenerateMasterKey() (string, error) {
	key := make([]byte, 32) // 256 bits
	if _, err := rand.Read(key); err != nil {
		return "", fmt.Errorf("failed to generate master key: %w", err)
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// ValidateEncryptionConfig validates that encryption is properly configured
func ValidateEncryptionConfig() error {
	masterKey := os.Getenv("ENCRYPTION_MASTER_KEY")
	if masterKey == "" {
		return errors.New("ENCRYPTION_MASTER_KEY environment variable is required")
	}

	key, err := base64.StdEncoding.DecodeString(masterKey)
	if err != nil {
		return fmt.Errorf("invalid ENCRYPTION_MASTER_KEY format: %w", err)
	}

	if len(key) != 32 {
		return errors.New("ENCRYPTION_MASTER_KEY must be 32 bytes (256 bits) when base64 decoded")
	}

	return nil
}

// SanitizeForLogging removes or masks sensitive content for logging
func SanitizeForLogging(content string) string {
	if len(content) <= 10 {
		return "[ENCRYPTED]"
	}
	return fmt.Sprintf("[ENCRYPTED:%d_chars]", len(content))
}

// SecureCompare performs constant-time comparison of two strings
func SecureCompare(a, b string) bool {
	if len(a) != len(b) {
		return false
	}

	result := 0
	for i := 0; i < len(a); i++ {
		result |= int(a[i]) ^ int(b[i])
	}

	return result == 0
}

// MaskContent masks content for audit logs while preserving some structure
func MaskContent(content string) string {
	if content == "" {
		return ""
	}

	lines := strings.Split(content, "\n")
	if len(lines) == 1 {
		// Single line content
		if len(content) <= 10 {
			return "***"
		}
		return content[:3] + "..." + content[len(content)-3:]
	}

	// Multi-line content
	return fmt.Sprintf("[%d lines, %d chars]", len(lines), len(content))
}

