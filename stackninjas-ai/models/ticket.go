package models

import "time"

// Ticket represents a support ticket.
// Ticket represents a support ticket.
// Fields:
//  - ID: UUID primary key
//  - Title: brief title
//  - Description: detailed text
//  - Category: ticket category
//  - Status: current ticket status
//  - Resolution: resolution text
//  - CreatedAt: creation timestamp
//  - UserID: Keycloak user identifier (sub claim)
type Ticket struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Category    string    `json:"category"`
    Status      string    `json:"status"`
    Resolution  string    `json:"resolution"`
    CreatedAt   time.Time `json:"created_at"`
    UserID      string    `json:"user_id"`
    AssignedTo  string    `json:"assigned_to"` // ID of assigned engineer, if any
}
