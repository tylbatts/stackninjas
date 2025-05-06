package handlers

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "stackninjas-ai/config"
    "stackninjas-ai/models"
    "stackninjas-ai/store"
    "stackninjas-ai/middleware"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

var (
    suggestionStore = store.NewWorkflowSuggestionStore()
    wfConfig        *config.Config
)

// RegisterWorkflowRoutes registers endpoints for workflow suggestions.
func RegisterWorkflowRoutes(r *gin.RouterGroup, cfg *config.Config) {
    wfConfig = cfg
    ws := r.Group("/suggestions")
    ws.GET("", listSuggestions)
    ws.GET("/:id", getSuggestion)
    ws.POST("", createSuggestion)
    // Update a suggestion (admin only)
    ws.PUT("/:id", middleware.AdminRoleMiddleware(), updateSuggestion)
    ws.DELETE("/:id", middleware.AdminRoleMiddleware(), deleteSuggestion)
}

// RegisterWorkflowAdminRoutes registers admin-only workflow endpoints under /admin.
func RegisterWorkflowAdminRoutes(r *gin.RouterGroup) {
    // GET /admin/workflows/pending
    r.GET("/workflows/pending", pendingWorkflowSuggestions)
    // POST /admin/workflows/:id/approve
    r.POST("/workflows/:id/approve", approveWorkflowSuggestion)
}

// pendingWorkflowSuggestions returns suggestions where Approved is false.
func pendingWorkflowSuggestions(c *gin.Context) {
    all := suggestionStore.GetAll()
    var pending []*models.WorkflowSuggestion
    for _, s := range all {
        if !s.Approved {
            pending = append(pending, s)
        }
    }
    c.JSON(http.StatusOK, pending)
}

// approveWorkflowSuggestion marks a suggestion as approved.
func approveWorkflowSuggestion(c *gin.Context) {
    id := c.Param("id")
    sug, err := suggestionStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "suggestion not found"})
        return
    }
    sug.Approved = true
    if err := suggestionStore.Update(id, sug); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update suggestion"})
        return
    }
    c.JSON(http.StatusOK, sug)
}

// AutoCreateSuggestionsFromResolved scans all tickets and auto-creates suggestions for resolved tickets.
func AutoCreateSuggestionsFromResolved() {
    tickets := store.DefaultTicketStore.GetAll()
    for _, t := range tickets {
        if t.Status == "resolved" && t.Resolution != "" {
            // skip if already created
            existing := suggestionStore.GetBySourceTicketID(t.ID)
            if len(existing) > 0 {
                continue
            }
            // create new suggestion
            now := time.Now()
            sug := &models.WorkflowSuggestion{
                ID:             uuid.NewString(),
                Tag:            t.Category,
                Summary:        fmt.Sprintf("%s: %s", t.Title, t.Description),
                Steps:          t.Resolution,
                CreatedBy:      t.UserID,
                CreatedAt:      now,
                SourceTicketID: t.ID,
                Approved:       false,
            }
            suggestionStore.Create(sug)
            // index in Qdrant
            textEmbed := fmt.Sprintf("%s\n\n%s", sug.Summary, sug.Steps)
            if vec, err := embedText(textEmbed); err == nil {
                _ = upsertWorkflowVector(sug.ID, vec, map[string]interface{}{
                    "tag":             sug.Tag,
                    "created_by":      sug.CreatedBy,
                    "summary":         sug.Summary,
                    "steps":           sug.Steps,
                    "source_ticket_id": sug.SourceTicketID,
                    "approved":        sug.Approved,
                })
            }
        }
    }
}

// listSuggestions returns all suggestions or filters by tag query param.
func listSuggestions(c *gin.Context) {
    tag := c.Query("tag")
    var result []*models.WorkflowSuggestion
    if tag != "" {
        result = suggestionStore.GetByTag(tag)
    } else {
        result = suggestionStore.GetAll()
    }
    // Only return approved suggestions
    var approved []*models.WorkflowSuggestion
    for _, s := range result {
        if s.Approved {
            approved = append(approved, s)
        }
    }
    c.JSON(http.StatusOK, approved)
}

// getSuggestion returns a single suggestion by ID.
func getSuggestion(c *gin.Context) {
    id := c.Param("id")
    sug, err := suggestionStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "suggestion not found"})
        return
    }
    c.JSON(http.StatusOK, sug)
}

// createSuggestion adds a new workflow suggestion and indexes it in Qdrant.
func createSuggestion(c *gin.Context) {
    var input struct {
        Tag     string `json:"tag" binding:"required"`
        Summary string `json:"summary" binding:"required"`
        Steps   string `json:"steps" binding:"required"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userI, _ := c.Get("user")
    userID, _ := userI.(string)
    now := time.Now()
    sug := &models.WorkflowSuggestion{
        ID:        uuid.NewString(),
        Tag:       input.Tag,
        Summary:   input.Summary,
        Steps:     input.Steps,
        CreatedBy: userID,
        CreatedAt: now,
    }
    suggestionStore.Create(sug)
    // Index in Qdrant
    textEmbed := fmt.Sprintf("%s\n\n%s", sug.Summary, sug.Steps)
    vec, err := embedText(textEmbed)
    if err == nil {
        _ = upsertWorkflowVector(sug.ID, vec, map[string]interface{}{ // ignore error
            "tag":        sug.Tag,
            "created_by": sug.CreatedBy,
            "summary":    sug.Summary,
            "steps":      sug.Steps,
        })
    }
    c.JSON(http.StatusCreated, sug)
}

// deleteSuggestion removes a suggestion by ID; admin only.
func deleteSuggestion(c *gin.Context) {
    id := c.Param("id")
    if err := suggestionStore.Delete(id); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "suggestion not found"})
        return
    }
    c.Status(http.StatusNoContent)
}
// updateSuggestion modifies an existing workflow suggestion (admin only).
func updateSuggestion(c *gin.Context) {
    id := c.Param("id")
    var input struct {
        Tag     string `json:"tag" binding:"required"`
        Summary string `json:"summary" binding:"required"`
        Steps   string `json:"steps" binding:"required"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    sug, err := suggestionStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "suggestion not found"})
        return
    }
    sug.Tag = input.Tag
    sug.Summary = input.Summary
    sug.Steps = input.Steps
    if err := suggestionStore.Update(id, sug); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update suggestion"})
        return
    }
    // Re-index in Qdrant
    textEmbed := fmt.Sprintf("%s\n\n%s", sug.Summary, sug.Steps)
    if vec, err := embedText(textEmbed); err == nil {
        _ = upsertWorkflowVector(sug.ID, vec, map[string]interface{}{ // ignore error
            "tag":        sug.Tag,
            "created_by": sug.CreatedBy,
            "summary":    sug.Summary,
            "steps":      sug.Steps,
        })
    }
    c.JSON(http.StatusOK, sug)
}

// embedText calls the embed API to get embeddings for given text.
func embedText(text string) ([]float64, error) {
    reqBody := map[string]string{"text": text}
    b, _ := json.Marshal(reqBody)
    resp, err := http.Post(fmt.Sprintf("%s/embed-text", wfConfig.EmbedAPIURL), "application/json", bytes.NewReader(b))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    var er struct{ Vector []float64 `json:"vector"` }
    if err := json.NewDecoder(resp.Body).Decode(&er); err != nil {
        return nil, err
    }
    return er.Vector, nil
}

// upsertWorkflowVector upserts a single point into the Qdrant workflow_suggestions collection.
func upsertWorkflowVector(id string, vector []float64, payload map[string]interface{}) error {
    url := fmt.Sprintf("%s/collections/%s/points?wait=true", wfConfig.QdrantURL, wfConfig.WorkflowCollection)
    pt := map[string]interface{}{
        "id":      id,
        "vector":  vector,
        "payload": payload,
    }
    body := map[string]interface{}{"points": []interface{}{pt}}
    b, _ := json.Marshal(body)
    resp, err := http.Post(url, "application/json", bytes.NewReader(b))
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 300 {
        return fmt.Errorf("qdrant upsert failed: %s", resp.Status)
    }
    return nil
}