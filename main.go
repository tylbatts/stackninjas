package main

import (
    "fmt"
    "log"
    "net/http"
    "os"
    "time"

    "stackninjas-ai/config"
    "stackninjas-ai/middleware"
    "stackninjas-ai/handlers"
    "stackninjas-ai/seed"
    "stackninjas-ai/store"
    "stackninjas-ai/models"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "github.com/gin-gonic/gin"
)

func main() {
    cfg, err := config.LoadConfig()
    if err != nil {
        log.Fatalf("failed to load config: %v", err)
    }

    err = middleware.InitJWKs(cfg)
    if err != nil {
        log.Fatalf("failed to initialize JWKs: %v", err)
    }

    // Initialize GORM/Postgres connection
    db, err := gorm.Open(postgres.Open(cfg.DatabaseDSN), &gorm.Config{})
    if err != nil {
        log.Fatalf("failed to connect to database: %v", err)
    }
    // Auto-migrate models
    if err := db.AutoMigrate(&models.Ticket{}, &models.Comment{}, &models.WorkflowSuggestion{}, &models.WorkflowFeedback{}); err != nil {
        log.Fatalf("auto-migrate failed: %v", err)
    }
    // Seed sample tickets if empty
    if err := seed.SeedTickets(db); err != nil {
        log.Printf("warning: seeding tickets failed: %v", err)
    }
    // Override handlers to use GORM stores
    handlers.SetTicketStore(store.NewGormTicketStore(db))
    handlers.SetCommentStore(store.NewGormCommentStore(db))

    router := gin.Default()
    // Enable CORS for requests from the frontend origin
    router.Use(func(c *gin.Context) {
        origin := c.GetHeader("Origin")
        if origin == "http://localhost" {
            c.Header("Access-Control-Allow-Origin", origin)
            c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
            c.Header("Access-Control-Expose-Headers", "Content-Length")
            c.Header("Access-Control-Allow-Credentials", "true")
        }
        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }
        c.Next()
    })
    // Health check endpoint (no auth)
    router.GET("/healthz", handlers.HealthHandler(cfg))

    // Protected routes
    auth := router.Group("/")
    auth.Use(middleware.AuthMiddleware(cfg))

    handlers.RegisterTicketRoutes(auth)
    handlers.RegisterWorkflowRoutes(auth, cfg)
    // Admin-only endpoints for workflow approval
    adminWorkflow := router.Group("/admin")
    adminWorkflow.Use(middleware.AuthMiddleware(cfg), middleware.AdminRoleMiddleware())
    handlers.RegisterWorkflowAdminRoutes(adminWorkflow)
    // Background auto-create workflow suggestions for resolved tickets
    go func() {
        for {
            handlers.AutoCreateSuggestionsFromResolved()
            time.Sleep(time.Minute)
        }
    }()
    handlers.RegisterChatbotRoutes(auth, cfg)
    // Register AI document upload route
    handlers.RegisterAIRoutes(auth, cfg)
    // Admin routes (requires admin role)
    adminGroup := router.Group("/admin")
    adminGroup.Use(middleware.AuthMiddleware(cfg), middleware.AdminRoleMiddleware())
    handlers.RegisterAdminRoutes(adminGroup)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    addr := fmt.Sprintf(":%s", port)
    if err := router.Run(addr); err != nil {
        log.Fatalf("failed to run server: %v", err)
    }
}
