package store

import (
   "gorm.io/gorm"
   "stackninjas-ai/models"
)

// GormCommentStore implements CommentStoreInterface using GORM.
type GormCommentStore struct {
   db *gorm.DB
}

// NewGormCommentStore creates a new GormCommentStore.
func NewGormCommentStore(db *gorm.DB) *GormCommentStore {
   return &GormCommentStore{db: db}
}

// GetByTicket returns comments for a specific ticket.
func (s *GormCommentStore) GetByTicket(ticketID string) []*models.Comment {
   var cs []*models.Comment
   s.db.Where("ticket_id = ?", ticketID).Order("created_at asc").Find(&cs)
   return cs
}

// Create adds a new comment.
func (s *GormCommentStore) Create(cmt *models.Comment) {
   s.db.Create(cmt)
}

// Delete removes a comment by ID.
func (s *GormCommentStore) Delete(id string) error {
   res := s.db.Delete(&models.Comment{}, "id = ?", id)
   if res.RowsAffected == 0 {
       return ErrCommentNotFound
   }
   return res.Error
}