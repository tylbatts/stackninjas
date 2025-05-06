package handlers

import (
    "net/http"
    "time"

    "stackninjas-ai/config"
    "stackninjas-ai/store"
    "github.com/gin-gonic/gin"
)

// HealthHandler returns a lightweight endpoint to check system health.
// Checks in-memory DB, Qdrant availability, and Keycloak JWKS endpoint.
func HealthHandler(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. In-memory DB (always healthy unless panic)
        db := store.NewTicketStore()
        _ = db.GetAll()

        // 2. Qdrant health: GET collections
        client := http.Client{Timeout: 2 * time.Second}
        qURL := cfg.QdrantURL + "/collections"
        // Qdrant health
        res, err := client.Get(qURL)
        if err != nil || res.StatusCode != http.StatusOK {
            c.JSON(http.StatusServiceUnavailable, gin.H{"error": "qdrant unreachable"})
            return
        }
        res.Body.Close()

        // 3. Keycloak JWKS endpoint
        // Keycloak health
        res2, err := client.Get(cfg.JwksURL)
        if err != nil || res2.StatusCode != http.StatusOK {
            c.JSON(http.StatusServiceUnavailable, gin.H{"error": "keycloak unreachable"})
            return
        }
        res2.Body.Close()

        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    }
}