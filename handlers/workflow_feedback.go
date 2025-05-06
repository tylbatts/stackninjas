package handlers

import (
    "fmt"
    "net/http"
    "sort"
    "time"

    "stackninjas-ai/models"
    "stackninjas-ai/store"
    "stackninjas-ai/middleware"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

// RegisterFeedbackRoutes registers routes for workflow feedback.
func RegisterFeedbackRoutes(r *gin.RouterGroup) {
    fb := r.Group("/workflows/:workflow_id/feedback")
    fb.GET("", getFeedback)
    fb.POST("", createFeedback)
    fb.DELETE("/:feedback_id", middleware.AdminRoleMiddleware(), deleteFeedback)
    // Top rated suggestions
    r.GET("/workflows/top-rated", topRatedWorkflows)
}

// getFeedback returns all feedback for a workflow.
func getFeedback(c *gin.Context) {
    wid := c.Param("workflow_id")
    feedbacks := store.DefaultFeedbackStore.GetByWorkflow(wid)
    c.JSON(http.StatusOK, feedbacks)
}

// createFeedback adds a new feedback entry (upvote/downvote).
func createFeedback(c *gin.Context) {
    wid := c.Param("workflow_id")
    var input struct { Helpful bool `json:"helpful"` }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userI, _ := c.Get("user")
    author, _ := userI.(string)
    fb := &models.WorkflowFeedback{
        ID:         uuid.NewString(),
        WorkflowID: wid,
        AuthorID:   author,
        Helpful:    input.Helpful,
        CreatedAt:  time.Now(),
    }
    store.DefaultFeedbackStore.Create(fb)
    c.JSON(http.StatusCreated, fb)
}

// deleteFeedback removes a feedback entry (admin only).
func deleteFeedback(c *gin.Context) {
    fid := c.Param("feedback_id")
    if err := store.DefaultFeedbackStore.Delete(fid); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "feedback not found"})
        return
    }
    c.Status(http.StatusNoContent)
}

// topRatedWorkflows returns the top N workflows by helpful vote count.
func topRatedWorkflows(c *gin.Context) {
    // parse limit
    limit := 5
    if l := c.Query("limit"); l != "" {
        fmt.Sscanf(l, "%d", &limit)
    }
    // gather counts
    counts := make(map[string]int)
    for _, fb := range store.DefaultFeedbackStore.GetAll() {
        if fb.Helpful {
            counts[fb.WorkflowID]++
        }
    }
    suggestions := suggestionStore.GetAll()
    type item struct { Sug *models.WorkflowSuggestion; Count int }
    var items []item
    for _, s := range suggestions {
        items = append(items, item{Sug: s, Count: counts[s.ID]})
    }
    // sort by Count desc
    sort.Slice(items, func(i, j int) bool { return items[i].Count > items[j].Count })
    if len(items) > limit {
        items = items[:limit]
    }
    // prepare response
    var resp []models.WorkflowSuggestion
    for _, it := range items {
        resp = append(resp, *it.Sug)
    }
    c.JSON(http.StatusOK, resp)
}