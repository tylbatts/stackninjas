-- Seed initial tickets for devsecop scenarios
-- Tickets
INSERT INTO tickets (id, title, description, user_id, status, created_at) VALUES
  ('ticket-1', 'SQL Injection Vulnerability', 'Detected potential SQL injection in login module.', 'admin', 'Open', NOW()),
  ('ticket-2', 'Cross-Site Scripting', 'Reflected XSS vulnerability on search endpoint.', 'admin', 'Open', NOW()),
  ('ticket-3', 'Open S3 Bucket Permissions', 'S3 bucket "devsec-bucket" is publicly accessible.', 'admin', 'Closed', NOW()),
  ('ticket-4', 'Malformed JWT Acceptance', 'API accepts expired JWT tokens.', 'admin', 'In Progress', NOW());

-- Comments
INSERT INTO comments (id, ticket_id, author, text, created_at) VALUES
  ('comment-1', 'ticket-1', 'SecurityBot', 'Automated scan detected SQL injection patterns.', NOW()),
  ('comment-2', 'ticket-2', 'SecurityBot', 'XSS payload <script> executed successfully.', NOW()),
  ('comment-3', 'ticket-3', 'SecurityBot', 'Permissions tightened to private.', NOW()),
  ('comment-4', 'ticket-4', 'SecurityBot', 'Added token expiry validation.', NOW());