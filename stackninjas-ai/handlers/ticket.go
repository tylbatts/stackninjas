package handlers

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "sort"
    "time"

    "stackninjas-ai/models"
    "stackninjas-ai/store"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

// ticketStore handles ticket persistence; can be swapped out for GORM
var ticketStore store.TicketStoreInterface

func init() {
   // default to in-memory store
   ticketStore = store.DefaultTicketStore
}

// SetTicketStore overrides the default ticket store (e.g., to use GORM)
func SetTicketStore(ts store.TicketStoreInterface) {
   ticketStore = ts
}

// isAdmin returns true if the authenticated user has the 'admin' role.
func isAdmin(c *gin.Context) bool {
    if rolesI, exists := c.Get("roles"); exists {
        if roles, ok := rolesI.([]string); ok {
            for _, r := range roles {
                if r == "admin" {
                    return true
                }
            }
        }
    }
    return false
}

// suggestedWorkflowsHandler returns semantically similar workflow suggestions for a ticket.
func suggestedWorkflowsHandler(c *gin.Context) {
    id := c.Param("id")
    ticket, err := ticketStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
        return
    }
    // Authorization: owner or admin
    if !isAdmin(c) {
        userI, _ := c.Get("user")
        userID, _ := userI.(string)
        if ticket.UserID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
    }
    // 1) Embed ticket title + description
    text := fmt.Sprintf("%s\n\n%s", ticket.Title, ticket.Description)
    vec, err := embedText(text)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to embed ticket"})
        return
    }
    // 2) Search Qdrant workflow_suggestions collection
    searchBody := map[string]interface{}{
        "vector":       vec,
        "limit":        3,
        "with_payload": true,
        "score_threshold": 0.0,
    }
    b, _ := json.Marshal(searchBody)
    url := fmt.Sprintf("%s/collections/%s/points/search", wfConfig.QdrantURL, wfConfig.WorkflowCollection)
    resp, err := http.Post(url, "application/json", bytes.NewReader(b))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
        return
    }
    defer resp.Body.Close()
    var res struct {
        Result []struct {
            ID      string                 `json:"id"`
            Payload map[string]interface{} `json:"payload"`
            Score   float64                `json:"score"`
        } `json:"result"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid search response"})
        return
    }
    // 3) Build suggestions list with helpful counts
    type hitData struct {
        Sug          models.WorkflowSuggestion
        Score        float64
        HelpfulCount int
    }
    var hits []hitData
    for _, hit := range res.Result {
        sug, err := suggestionStore.GetByID(hit.ID)
        if err != nil || !sug.Approved {
            continue
        }
        // count helpful feedback
        helpful := store.DefaultFeedbackStore.CountHelpful(sug.ID)
        hits = append(hits, hitData{*sug, hit.Score, helpful})
    }
    // sort by relevance score, then helpful count
    sort.Slice(hits, func(i, j int) bool {
        if hits[i].Score != hits[j].Score {
            return hits[i].Score > hits[j].Score
        }
        return hits[i].HelpfulCount > hits[j].HelpfulCount
    })
    // format response
    var suggestionsList []map[string]interface{}
    for _, h := range hits {
        suggestionsList = append(suggestionsList, map[string]interface{}{
            "id":            h.Sug.ID,
            "tag":           h.Sug.Tag,
            "summary":       h.Sug.Summary,
            "steps":         h.Sug.Steps,
            "score":         h.Score,
            "helpful_count": h.HelpfulCount,
        })
    }
    c.JSON(http.StatusOK, suggestionsList)
}

// RegisterTicketRoutes registers CRUD routes for tickets.
func RegisterTicketRoutes(r *gin.RouterGroup) {
    tickets := r.Group("/tickets")
    tickets.GET("", listTickets)
    tickets.POST("", createTicket)

    // Routes for a specific ticket by ID
    ticket := tickets.Group("/:id")
    ticket.GET("", getTicket)
    ticket.PUT("", updateTicket)
    ticket.DELETE("", deleteTicket)
    ticket.GET("/suggested-workflows", suggestedWorkflowsHandler)

    // Nested comment routes under a ticket
    RegisterCommentRoutes(ticket)
}

// listTickets returns all tickets for admin or only the user's tickets.
func listTickets(c *gin.Context) {
    all := ticketStore.GetAll()
    // Optional filter by assigned engineer
    assignedToParam := c.Query("assigned_to")
    var result []*models.Ticket
    if isAdmin(c) {
        result = all
    } else {
        userI, _ := c.Get("user")
        userID, _ := userI.(string)
        for _, t := range all {
            if t.UserID == userID {
                result = append(result, t)
            }
        }
    }
    // Apply assigned_to filter if provided
    if assignedToParam != "" {
        var filtered []*models.Ticket
        for _, t := range result {
            if t.AssignedTo == assignedToParam {
                filtered = append(filtered, t)
            }
        }
        result = filtered
    }
    c.JSON(http.StatusOK, result)
}

// getTicket returns a specific ticket if admin or owner.
func getTicket(c *gin.Context) {
    id := c.Param("id")
    ticket, err := ticketStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
        return
    }
    if !isAdmin(c) {
        userI, _ := c.Get("user")
        userID, _ := userI.(string)
        if ticket.UserID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
    }
    // Include associated comments, sorted by creation time
    comments := commentStore.GetByTicket(id)
    // sort comments by CreatedAt ascending
    sort.Slice(comments, func(i, j int) bool {
        return comments[i].CreatedAt.Before(comments[j].CreatedAt)
    })
    // Response includes ticket fields + comments
    resp := struct {
        models.Ticket
        Comments []*models.Comment `json:"comments"`
    }{
        *ticket,
        comments,
    }
    c.JSON(http.StatusOK, resp)
}

// createTicket creates a new ticket with the authenticated user as owner.
func createTicket(c *gin.Context) {
    var input struct {
        Title       string `json:"title" binding:"required"`
        Description string `json:"description" binding:"required"`
        Category    string `json:"category" binding:"required"`
        Status      string `json:"status" binding:"required"`
        Resolution  string `json:"resolution"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userI, _ := c.Get("user")
    userID, _ := userI.(string)
    now := time.Now()
    ticket := &models.Ticket{
        ID:          uuid.NewString(),
        Title:       input.Title,
        Description: input.Description,
        Category:    input.Category,
        Status:      input.Status,
        Resolution:  input.Resolution,
        CreatedAt:   now,
        UserID:      userID,
        AssignedTo:  "",
    }
    ticketStore.Create(ticket)
    c.JSON(http.StatusCreated, ticket)
}

// updateTicket updates an existing ticket if admin or owner.
func updateTicket(c *gin.Context) {
    id := c.Param("id")
    var input struct {
        Title       string `json:"title" binding:"required"`
        Description string `json:"description" binding:"required"`
        Category    string `json:"category" binding:"required"`
        Status      string `json:"status" binding:"required"`
        Resolution  string `json:"resolution"`
        AssignedTo  string `json:"assigned_to"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    existing, err := ticketStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
        return
    }
    if !isAdmin(c) {
        // Regular users can only update their own tickets and not reassigned
        userI, _ := c.Get("user")
        userID, _ := userI.(string)
        if existing.UserID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
        // Prevent non-admin from changing assigned_to
        if input.AssignedTo != existing.AssignedTo {
            c.JSON(http.StatusForbidden, gin.H{"error": "cannot reassign ticket"})
            return
        }
    }
    existing.Title = input.Title
    existing.Description = input.Description
    existing.Category = input.Category
    existing.Status = input.Status
    existing.Resolution = input.Resolution
    // Only admin can change assignment
    if isAdmin(c) {
        existing.AssignedTo = input.AssignedTo
    }
    if err := ticketStore.Update(id, existing); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ticket"})
        return
    }
    c.JSON(http.StatusOK, existing)
}

// deleteTicket deletes a ticket if admin or owner.
func deleteTicket(c *gin.Context) {
    id := c.Param("id")
    ticket, err := ticketStore.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
        return
    }
    if !isAdmin(c) {
        userI, _ := c.Get("user")
        userID, _ := userI.(string)
        if ticket.UserID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
    }
    if err := ticketStore.Delete(id); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete ticket"})
        return
    }
    c.Status(http.StatusNoContent)
}