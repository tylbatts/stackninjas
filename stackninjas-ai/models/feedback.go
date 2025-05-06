package models

import "time"

// WorkflowFeedback represents user feedback on a workflow suggestion.
type WorkflowFeedback struct {
    ID           string    `json:"id"`
    WorkflowID   string    `json:"workflow_id"`
    AuthorID     string    `json:"author_id"`
    Helpful      bool      `json:"helpful"`
    CreatedAt    time.Time `json:"created_at"`
}