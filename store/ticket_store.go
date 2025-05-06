package store

import (
    "errors"
    "sync"

    "stackninjas-ai/models"
)

var ErrTicketNotFound = errors.New("ticket not found")

// TicketStoreInterface defines methods for ticket persistence (used for GORM integration).
type TicketStoreInterface interface {
   GetAll() []*models.Ticket
   GetByID(id string) (*models.Ticket, error)
   Create(t *models.Ticket)
   Update(id string, t *models.Ticket) error
   Delete(id string) error
}

// TicketStore provides thread-safe access to tickets.
type TicketStore struct {
    mu      sync.RWMutex
    tickets map[string]*models.Ticket
}

// NewTicketStore creates a new TicketStore.
func NewTicketStore() *TicketStore {
    return &TicketStore{
        tickets: make(map[string]*models.Ticket),
    }
}

// DefaultTicketStore is a shared in-memory store for tickets.
var DefaultTicketStore = NewTicketStore()

// GetAll returns all tickets.
func (s *TicketStore) GetAll() []*models.Ticket {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]*models.Ticket, 0, len(s.tickets))
    for _, t := range s.tickets {
        result = append(result, t)
    }
    return result
}

// GetByID returns a ticket by ID.
func (s *TicketStore) GetByID(id string) (*models.Ticket, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    t, ok := s.tickets[id]
    if !ok {
        return nil, ErrTicketNotFound
    }
    return t, nil
}

// Create adds a new ticket.
func (s *TicketStore) Create(t *models.Ticket) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.tickets[t.ID] = t
}

// Update modifies an existing ticket.
func (s *TicketStore) Update(id string, t *models.Ticket) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    _, ok := s.tickets[id]
    if !ok {
        return ErrTicketNotFound
    }
    s.tickets[id] = t
    return nil
}

// Delete removes a ticket by ID.
func (s *TicketStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.tickets[id]; !ok {
        return ErrTicketNotFound
    }
    delete(s.tickets, id)
    return nil
}
