package store

import (
    "errors"
    "sync"

    "stackninjas-ai/models"
)

var ErrCommentNotFound = errors.New("comment not found")

// CommentStoreInterface defines methods for comment persistence (used for GORM integration).
type CommentStoreInterface interface {
   GetByTicket(ticketID string) []*models.Comment
   Create(cmt *models.Comment)
   Delete(id string) error
}

// CommentStore provides thread-safe storage for comments.
type CommentStore struct {
    mu       sync.RWMutex
    comments map[string]*models.Comment
}

// NewCommentStore creates a new CommentStore.
func NewCommentStore() *CommentStore {
    return &CommentStore{
        comments: make(map[string]*models.Comment),
    }
}

// GetByTicket returns all comments associated with a ticket.
func (s *CommentStore) GetByTicket(ticketID string) []*models.Comment {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*models.Comment
    for _, c := range s.comments {
        if c.TicketID == ticketID {
            result = append(result, c)
        }
    }
    return result
}

// Create adds a new comment to the store.
func (s *CommentStore) Create(cmt *models.Comment) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.comments[cmt.ID] = cmt
}

// Delete removes a comment by ID.
func (s *CommentStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.comments[id]; !ok {
        return ErrCommentNotFound
    }
    delete(s.comments, id)
    return nil
}