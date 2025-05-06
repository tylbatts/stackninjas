package store

import (
    "errors"
    "sync"

    "stackninjas-ai/models"
)

var ErrFeedbackNotFound = errors.New("feedback not found")

// FeedbackStore provides thread-safe storage for workflow feedback.
type FeedbackStore struct {
    mu       sync.RWMutex
    feedback map[string]*models.WorkflowFeedback
}

// NewFeedbackStore creates a new FeedbackStore.
func NewFeedbackStore() *FeedbackStore {
    return &FeedbackStore{
        feedback: make(map[string]*models.WorkflowFeedback),
    }
}

// DefaultFeedbackStore is a shared in-memory store for workflow feedback.
var DefaultFeedbackStore = NewFeedbackStore()

// GetAll returns all feedback entries.
func (s *FeedbackStore) GetAll() []*models.WorkflowFeedback {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*models.WorkflowFeedback
    for _, fb := range s.feedback {
        result = append(result, fb)
    }
    return result
}

// GetByWorkflow returns all feedback entries for a given workflow.
func (s *FeedbackStore) GetByWorkflow(workflowID string) []*models.WorkflowFeedback {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*models.WorkflowFeedback
    for _, fb := range s.feedback {
        if fb.WorkflowID == workflowID {
            result = append(result, fb)
        }
    }
    return result
}

// CountHelpful returns the number of helpful feedbacks for a workflow.
func (s *FeedbackStore) CountHelpful(workflowID string) int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    count := 0
    for _, fb := range s.feedback {
        if fb.WorkflowID == workflowID && fb.Helpful {
            count++
        }
    }
    return count
}

// Create adds a new feedback entry.
func (s *FeedbackStore) Create(fb *models.WorkflowFeedback) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.feedback[fb.ID] = fb
}

// Delete removes a feedback entry by ID.
func (s *FeedbackStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.feedback[id]; !ok {
        return ErrFeedbackNotFound
    }
    delete(s.feedback, id)
    return nil
}