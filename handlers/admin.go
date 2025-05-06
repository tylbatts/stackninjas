package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// UserActivityEntry represents a user's ticket activity summary.
type UserActivityEntry struct {
    UserID      string `json:"user_id"`
    TicketCount int    `json:"ticket_count"`
    LastLogin   string `json:"last_login"` // optional, empty if unknown
}

// RegisterAdminRoutes registers admin-specific endpoints on the given group.
// Expects the parent group to be mounted at /admin with proper auth and admin role middleware.
func RegisterAdminRoutes(r *gin.RouterGroup) {
    // GET /admin/user-activity
    r.GET("/user-activity", userActivityHandler)
    // GET /admin/tickets: list all tickets (admin only)
    r.GET("/tickets", adminTicketsHandler)
}

// userActivityHandler returns a summary of tickets per user.
func userActivityHandler(c *gin.Context) {
    // Count tickets per user
    counts := make(map[string]int)
    tickets := ticketStore.GetAll()
    for _, t := range tickets {
        counts[t.UserID]++
    }
    // Build response
    var result []UserActivityEntry
    for user, cnt := range counts {
        result = append(result, UserActivityEntry{
            UserID:      user,
            TicketCount: cnt,
            LastLogin:   "", // not available
        })
    }
    c.JSON(http.StatusOK, result)
}
// adminTicketsHandler returns all tickets regardless of user
func adminTicketsHandler(c *gin.Context) {
    // ticketStore is the shared in-memory store from handlers/ticket.go
    tickets := ticketStore.GetAll()
    c.JSON(http.StatusOK, tickets)
}