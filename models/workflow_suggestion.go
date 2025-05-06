package models

import "time"

// WorkflowSuggestion represents a suggested workflow or fix for a given tag.
type WorkflowSuggestion struct {
    ID             string    `json:"id"`
    Tag            string    `json:"tag"`
    Summary        string    `json:"summary"`
    Steps          string    `json:"steps"`
    CreatedBy      string    `json:"created_by"`
    CreatedAt      time.Time `json:"created_at"`
    SourceTicketID string    `json:"source_ticket_id,omitempty"` // Created from resolved ticket
    Approved       bool      `json:"approved"`
}