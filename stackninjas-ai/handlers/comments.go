package handlers

import (
    "net/http"
    "time"

    "stackninjas-ai/middleware"
    "stackninjas-ai/models"
    "stackninjas-ai/store"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

// commentStore handles comment persistence; can be swapped out for GORM
var commentStore store.CommentStoreInterface

func init() {
   // default to in-memory store
   commentStore = store.NewCommentStore()
}

// SetCommentStore overrides the default comment store (e.g., to use GORM)
func SetCommentStore(cs store.CommentStoreInterface) {
   commentStore = cs
}

// RegisterCommentRoutes registers routes for managing comments under a ticket.
func RegisterCommentRoutes(r *gin.RouterGroup) {
    comments := r.Group("/comments")
    comments.GET("", getComments)
    comments.POST("", createComment)
    // Admin-only delete
    comments.DELETE("/:comment_id", middleware.AdminRoleMiddleware(), deleteComment)
}

// getComments returns all comments for the specified ticket.
func getComments(c *gin.Context) {
    ticketID := c.Param("id")
    // Ensure user has access to the ticket
    ticket, err := ticketStore.GetByID(ticketID)
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
    comments := commentStore.GetByTicket(ticketID)
    c.JSON(http.StatusOK, comments)
}

// createComment adds a new comment to the specified ticket.
func createComment(c *gin.Context) {
    ticketID := c.Param("id")
    // Ensure ticket exists and user has access
    ticket, err := ticketStore.GetByID(ticketID)
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
    var input struct { Content string `json:"content" binding:"required"` }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userI, _ := c.Get("user")
    authorID, _ := userI.(string)
    comment := &models.Comment{
        ID:        uuid.NewString(),
        TicketID:  ticketID,
        AuthorID:  authorID,
        Content:   input.Content,
        CreatedAt: time.Now(),
    }
    commentStore.Create(comment)
    c.JSON(http.StatusCreated, comment)
}

// deleteComment removes a comment (admin only).
func deleteComment(c *gin.Context) {
    commentID := c.Param("comment_id")
    if err := commentStore.Delete(commentID); err != nil {
        if err == store.ErrCommentNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete comment"})
        }
        return
    }
    c.Status(http.StatusNoContent)
}