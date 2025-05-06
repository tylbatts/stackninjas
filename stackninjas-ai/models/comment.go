package models

import "time"

// Comment represents a comment on a support ticket.
type Comment struct {
    ID        string    `json:"id"`
    TicketID  string    `json:"ticket_id"`
    AuthorID  string    `json:"author_id"`
    Content   string    `json:"content"`
    CreatedAt time.Time `json:"created_at"`
}