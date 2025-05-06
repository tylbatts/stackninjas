package handlers

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"

    "stackninjas-ai/config"
    "github.com/gin-gonic/gin"
)

// RegisterChatbotRoutes registers the chatbot endpoints.
func RegisterChatbotRoutes(r *gin.RouterGroup, cfg *config.Config) {
    // Simple echo endpoint
    r.POST("/chatbot", chatbotHandler)
    // RAG-based response endpoint
    r.POST("/chatbot/respond", respondHandler(cfg))
}
// ChatRespondRequest is the request body for /chatbot/respond
type ChatRespondRequest struct {
    UserID   string `json:"user_id" binding:"required"`
    Question string `json:"question" binding:"required"`
}

// ContextItem represents a retrieved chunk from Qdrant
type ContextItem struct {
    FileName string  `json:"file_name"`
    ChunkID  int     `json:"chunk_id"`
    Text     string  `json:"text"`
    Score    float64 `json:"score"`
}

// ChatRespondResponse is the response body for /chatbot/respond
// WorkflowSuggestionResponse represents a concise workflow suggestion returned to the chat client
type WorkflowSuggestionResponse struct {
    ID      string  `json:"id"`
    Tag     string  `json:"tag"`
    Summary string  `json:"summary"`
    Steps   string  `json:"steps"`
    Score   float64 `json:"score"`
}
// ChatRespondResponse is the response body for /chatbot/respond
type ChatRespondResponse struct {
    Answer              string                         `json:"answer"`
    Context             []ContextItem                  `json:"context"`
    WorkflowSuggestions []WorkflowSuggestionResponse   `json:"workflow_suggestions"`
}

// respondHandler returns a handler that performs RAG retrieval for questions
func respondHandler(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req ChatRespondRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        // 1) Generate embedding for the question via embed API
        embedReq := map[string]string{"text": req.Question}
        embedBody, _ := json.Marshal(embedReq)
        embedURL := fmt.Sprintf("%s/embed-text", cfg.QdrantURL) // assumes embed-text on same endpoint; adjust as needed
        // Note: replace embedURL with actual embedding service URL if separate
        var vector []float64
        if resp, err := http.Post(embedURL, "application/json", bytes.NewReader(embedBody)); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to embed question"})
            return
        } else {
            defer resp.Body.Close()
            data, _ := ioutil.ReadAll(resp.Body)
            var er struct{ Vector []float64 `json:"vector"` }
            _ = json.Unmarshal(data, &er)
            vector = er.Vector
        }
        // 2) Query Qdrant for similar chunks
        searchReq := map[string]interface{}{  // Qdrant search by vector
            "vector":       vector,
            "limit":        5,
            "with_payload": true,
        }
        searchBody, _ := json.Marshal(searchReq)
        searchURL := fmt.Sprintf("%s/collections/%s/points/search", cfg.QdrantURL, cfg.QdrantCollection)
        var contextItems []ContextItem
        if resp, err := http.Post(searchURL, "application/json", bytes.NewReader(searchBody)); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Qdrant search failed"})
            return
        } else {
            defer resp.Body.Close()
            data, _ := ioutil.ReadAll(resp.Body)
            var qr struct{
                Result []struct{
                    ID      string                 `json:"id"`
                    Payload map[string]interface{} `json:"payload"`
                    Score   float64                `json:"score"`
                } `json:"result"`
            }
            _ = json.Unmarshal(data, &qr)
            for _, hit := range qr.Result {
                pid := hit.Payload["file_name"].(string)
                cidF, _ := hit.Payload["chunk_id"].(float64)
                txt := hit.Payload["text"].(string)
                contextItems = append(contextItems, ContextItem{
                    FileName: pid,
                    ChunkID:  int(cidF),
                    Text:     txt,
                    Score:    hit.Score,
                })
            }
        }
        // 3) (Optional) Call LLM here to generate Answer. For now leave blank or echo question
        answer := "" // placeholder for LLM-generated answer
        // 4) Retrieve semantically similar workflows
        searchWF := map[string]interface{}{
            "vector":       vector,
            "limit":        3,
            "with_payload": true,
        }
        b2, _ := json.Marshal(searchWF)
        wfURL := fmt.Sprintf("%s/collections/%s/points/search", cfg.QdrantURL, cfg.WorkflowCollection)
        var wfSuggestions []WorkflowSuggestionResponse
        if resp2, err := http.Post(wfURL, "application/json", bytes.NewReader(b2)); err == nil {
            defer resp2.Body.Close()
            var wr struct {
                Result []struct {
                    ID      string                 `json:"id"`
                    Payload map[string]interface{} `json:"payload"`
                    Score   float64                `json:"score"`
                } `json:"result"`
            }
            if err := json.NewDecoder(resp2.Body).Decode(&wr); err == nil {
                for _, hit := range wr.Result {
                    tag, _ := hit.Payload["tag"].(string)
                    summary, _ := hit.Payload["summary"].(string)
                    steps, _ := hit.Payload["steps"].(string)
                    wfSuggestions = append(wfSuggestions, WorkflowSuggestionResponse{
                        ID:      hit.ID,
                        Tag:     tag,
                        Summary: summary,
                        Steps:   steps,
                        Score:   hit.Score,
                    })
                }
            }
        }
        // Final response
        respObj := ChatRespondResponse{
            Answer:              answer,
            Context:             contextItems,
            WorkflowSuggestions: wfSuggestions,
        }
    c.JSON(http.StatusOK, respObj)
    }
}

// runRAGPipeline is no longer used; see respondHandler for RAG logic

// ChatRequest is the body for basic /chatbot echo endpoint
type ChatRequest struct {
    Message string `json:"message" binding:"required"`
}

type ChatResponse struct {
    Response string `json:"response"`
}

func chatbotHandler(c *gin.Context) {
    var req ChatRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    resp := ChatResponse{Response: "Echo: " + req.Message}
    c.JSON(http.StatusOK, resp)
}
