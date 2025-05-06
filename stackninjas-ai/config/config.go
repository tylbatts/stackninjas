package config

import (
    "fmt"
    "os"
)

// Config holds Keycloak and JWT configuration.
type Config struct {
    KeycloakURL string
    Realm       string
    ClientID    string
    Issuer      string
    JwksURL          string
    QdrantURL        string // URL of Qdrant vector DB
    QdrantAPIKey     string // API key for Qdrant (optional)
    QdrantCollection        string // Name of the Qdrant collection
    WorkflowCollection      string // Qdrant collection for workflow suggestions
    EmbedAPIURL             string // URL for text embedding service
    DatabaseDSN             string // GORM database DSN
}

// LoadConfig loads Keycloak configuration from environment variables.
func LoadConfig() (*Config, error) {
    kcURL := os.Getenv("KEYCLOAK_URL")
    realm := os.Getenv("KEYCLOAK_REALM")
    clientID := os.Getenv("KEYCLOAK_CLIENT_ID")
    if kcURL == "" || realm == "" || clientID == "" {
        return nil, fmt.Errorf("KEYCLOAK_URL, KEYCLOAK_REALM, and KEYCLOAK_CLIENT_ID must be set")
    }
    issuer := fmt.Sprintf("%s/realms/%s", kcURL, realm)
    jwksURL := fmt.Sprintf("%s/protocol/openid-connect/certs", issuer)
   // Load Qdrant configuration
   qURL := os.Getenv("QDRANT_URL")
   qKey := os.Getenv("QDRANT_API_KEY")
   qCol := os.Getenv("QDRANT_COLLECTION")
   if qURL == "" || qCol == "" {
       return nil, fmt.Errorf("QDRANT_URL and QDRANT_COLLECTION must be set")
   }
    // Load workflow suggestions collection name and embed API URL
    wfCol := os.Getenv("QDRANT_WORKFLOW_COLLECTION")
    if wfCol == "" {
        wfCol = "workflow_suggestions"
    }
    embedURL := os.Getenv("EMBED_API_URL")
    if embedURL == "" {
        embedURL = "http://localhost:8000"
    }
    // Load database DSN
    dbDSN := os.Getenv("DATABASE_DSN")
    if dbDSN == "" {
        return nil, fmt.Errorf("DATABASE_DSN must be set")
    }
    return &Config{
        KeycloakURL:      kcURL,
        Realm:            realm,
        ClientID:         clientID,
        Issuer:           issuer,
        JwksURL:          jwksURL,
        QdrantURL:        qURL,
        QdrantAPIKey:     qKey,
        QdrantCollection: qCol,
        WorkflowCollection: wfCol,
        EmbedAPIURL:      embedURL,
        DatabaseDSN:      dbDSN,
    }, nil
}
