package store

import (
    "errors"
    "sync"

    "stackninjas-ai/models"
)

var ErrWorkflowSuggestionNotFound = errors.New("workflow suggestion not found")

// WorkflowSuggestionStore stores WorkflowSuggestion records in memory.
type WorkflowSuggestionStore struct {
    mu          sync.RWMutex
    suggestions map[string]*models.WorkflowSuggestion
}

// NewWorkflowSuggestionStore creates a new in-memory store for workflow suggestions.
func NewWorkflowSuggestionStore() *WorkflowSuggestionStore {
    return &WorkflowSuggestionStore{
        suggestions: make(map[string]*models.WorkflowSuggestion),
    }
}

// GetAll returns all workflow suggestions.
func (s *WorkflowSuggestionStore) GetAll() []*models.WorkflowSuggestion {
    s.mu.RLock()
    defer s.mu.RUnlock()
    list := make([]*models.WorkflowSuggestion, 0, len(s.suggestions))
    for _, sug := range s.suggestions {
        list = append(list, sug)
    }
    return list
}

// GetByTag returns suggestions matching a specific tag.
func (s *WorkflowSuggestionStore) GetByTag(tag string) []*models.WorkflowSuggestion {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var list []*models.WorkflowSuggestion
    for _, sug := range s.suggestions {
        if sug.Tag == tag {
            list = append(list, sug)
        }
    }
    return list
}

// GetBySourceTicketID returns suggestions created from a specific ticket.
func (s *WorkflowSuggestionStore) GetBySourceTicketID(ticketID string) []*models.WorkflowSuggestion {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var list []*models.WorkflowSuggestion
    for _, sug := range s.suggestions {
        if sug.SourceTicketID == ticketID {
            list = append(list, sug)
        }
    }
    return list
}

// GetByID returns a single workflow suggestion by ID.
func (s *WorkflowSuggestionStore) GetByID(id string) (*models.WorkflowSuggestion, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    if sug, ok := s.suggestions[id]; ok {
        return sug, nil
    }
    return nil, ErrWorkflowSuggestionNotFound
}

// Create adds a new workflow suggestion.
func (s *WorkflowSuggestionStore) Create(sug *models.WorkflowSuggestion) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.suggestions[sug.ID] = sug
}

// Delete removes a workflow suggestion by ID.
func (s *WorkflowSuggestionStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.suggestions[id]; !ok {
        return ErrWorkflowSuggestionNotFound
    }
    delete(s.suggestions, id)
    return nil
}
// Update modifies an existing workflow suggestion.
func (s *WorkflowSuggestionStore) Update(id string, sug *models.WorkflowSuggestion) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.suggestions[id]; !ok {
        return ErrWorkflowSuggestionNotFound
    }
    s.suggestions[id] = sug
    return nil
}