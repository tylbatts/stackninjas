package seed

import (
   "math/rand"
   "time"

   "github.com/google/uuid"
   "gorm.io/gorm"
)

// SeedTickets populates the tickets table with sample data if it's empty.
func SeedTickets(db *gorm.DB) error {
   var count int64
   // Count existing tickets
   if err := db.Table("tickets").Count(&count).Error; err != nil {
       return err
   }
   // Nothing to do if already seeded
   if count > 0 {
       return nil
   }

   // Sample data
   titles := []string{
       "Unable to deploy to prod",
       "Email sending failure",
       "Slow database queries",
       "Missing data in reports",
       "Login page crash",
       "Payment gateway timeout",
       "Broken file upload",
       "API returning 500",
       "Feature request: Dark mode",
       "Incorrect billing amount",
   }
   descriptions := []string{
       "Deployment process fails with unexpected error code.",
       "Users are not receiving email notifications.",
       "Database queries are taking too long to complete.",
       "Monthly reports are missing recent entries.",
       "Application crashes when loading the login page.",
       "Payments are timing out intermittently.",
       "File uploads are corrupted upon download.",
       "API endpoints returning server error 500.",
       "Request to add dark theme to UI.",
       "Customers are billed incorrect amounts.",
   }
   statuses := []string{"open", "in_progress", "closed"}
   priorities := []string{"low", "medium", "high", "critical"}
   engineers := []string{
       "Alice Smith", "Bob Johnson", "Carol Williams", "David Brown", "Eve Davis",
       "Frank Miller", "Grace Wilson", "Henry Moore", "Ivy Taylor", "Jack Anderson",
   }
   companies := []string{
       "Acme Corp", "Globex Inc", "Soylent Corp", "Initech", "Umbrella Corp",
       "Stark Industries", "Wayne Enterprises", "Oscorp", "Nakatomi Trading", "Wonka Industries",
   }

   now := time.Now()
   // Insert 10 sample tickets
   for i := 0; i < 10; i++ {
       ticket := map[string]interface{}{
           "id":             uuid.NewString(),
           "title":          titles[i],
           "description":    descriptions[i],
           "status":         statuses[rand.Intn(len(statuses))],
           "priority":       priorities[rand.Intn(len(priorities))],
           "engineer_name":  engineers[rand.Intn(len(engineers))],
           "company_name":   companies[i],
           "created_at":     now,
           "updated_at":     now,
       }
       if err := db.Table("tickets").Create(ticket).Error; err != nil {
           return err
       }
   }
   return nil
}