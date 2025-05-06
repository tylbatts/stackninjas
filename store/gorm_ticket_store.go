package store

import (
   "errors"
   "gorm.io/gorm"
   "stackninjas-ai/models"
)

// GormTicketStore implements TicketStoreInterface using GORM.
type GormTicketStore struct {
   db *gorm.DB
}

// NewGormTicketStore creates a new GormTicketStore.
func NewGormTicketStore(db *gorm.DB) *GormTicketStore {
   return &GormTicketStore{db: db}
}

// GetAll returns all tickets from the database.
func (s *GormTicketStore) GetAll() []*models.Ticket {
   var ts []*models.Ticket
   s.db.Find(&ts)
   return ts
}

// GetByID retrieves a ticket by its ID.
func (s *GormTicketStore) GetByID(id string) (*models.Ticket, error) {
   var t models.Ticket
   err := s.db.First(&t, "id = ?", id).Error
   if errors.Is(err, gorm.ErrRecordNotFound) {
       return nil, ErrTicketNotFound
   }
   return &t, err
}

// Create inserts a new ticket into the database.
func (s *GormTicketStore) Create(t *models.Ticket) {
   s.db.Create(t)
}

// Update modifies an existing ticket.
func (s *GormTicketStore) Update(id string, t *models.Ticket) error {
   return s.db.Save(t).Error
}

// Delete removes a ticket by ID.
func (s *GormTicketStore) Delete(id string) error {
   res := s.db.Delete(&models.Ticket{}, "id = ?", id)
   if res.RowsAffected == 0 {
       return ErrTicketNotFound
   }
   return res.Error
}