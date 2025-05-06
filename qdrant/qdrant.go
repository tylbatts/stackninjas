package qdrant

import (
   "bytes"
   "context"
   "encoding/json"
   "fmt"
   "io/ioutil"
   "net/http"
   "strings"
)

type PointStruct struct {
	ID      string
	Vector  []float64
	Payload map[string]interface{}
}

type UpsertPoints struct {
	CollectionName string
	Points         []*PointStruct
}

type Client struct {
	URL    string
	APIKey string
}

func NewClient(url string, opts ...func(*Client)) *Client {
	client := &Client{URL: url}
	for _, opt := range opts {
		opt(client)
	}
	return client
}

func WithAPIKey(apiKey string) func(*Client) {
	return func(c *Client) {
		c.APIKey = apiKey
	}
}

// Upsert sends point data to Qdrant for upserting into the specified collection.
// It blocks until the operation is completed (wait=true).
func (c *Client) Upsert(ctx context.Context, req *UpsertPoints) error {
   if req == nil {
       return fmt.Errorf("qdrant: UpsertPoints request is nil")
   }
   // Build URL, trimming any trailing slash
   baseURL := strings.TrimRight(c.URL, "/")
   endpoint := fmt.Sprintf("%s/collections/%s/points?wait=true", baseURL, req.CollectionName)

   // Prepare points payload
   type point struct {
       ID      interface{}            `json:"id"`
       Vector  []float64              `json:"vector"`
       Payload map[string]interface{} `json:"payload,omitempty"`
   }
   body := struct {
       Points []point `json:"points"`
   }{}
   for _, p := range req.Points {
       body.Points = append(body.Points, point{
           ID:      p.ID,
           Vector:  p.Vector,
           Payload: p.Payload,
       })
   }

   data, err := json.Marshal(body)
   if err != nil {
       return fmt.Errorf("qdrant: failed to marshal request payload: %w", err)
   }

   // Create HTTP request with context
   httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
   if err != nil {
       return fmt.Errorf("qdrant: failed to create HTTP request: %w", err)
   }
   httpReq.Header.Set("Content-Type", "application/json")
   if c.APIKey != "" {
       httpReq.Header.Set("api-key", c.APIKey)
   }

   // Send request
   resp, err := http.DefaultClient.Do(httpReq)
   if err != nil {
       return fmt.Errorf("qdrant: HTTP request failed: %w", err)
   }
   defer resp.Body.Close()

   // Check for non-2xx status codes
   if resp.StatusCode < 200 || resp.StatusCode >= 300 {
       respBody, _ := ioutil.ReadAll(resp.Body)
       return fmt.Errorf("qdrant: unexpected status code %d: %s", resp.StatusCode, string(respBody))
   }
   return nil
}
