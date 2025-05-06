package handlers

import (
    "net/http"
    "bytes"
    "context"
    "io"
    "io/ioutil"
    "path/filepath"
    "strings"
    "time"

    "stackninjas-ai/config"
    "stackninjas-ai/qdrant"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/neurosnap/sentences/english"
    "github.com/rsc/pdf"
)

// RegisterAIRoutes registers AI routes.
func RegisterAIRoutes(r *gin.RouterGroup, cfg *config.Config) {
    r.POST("/ai/upload-doc", uploadDocHandler(cfg))
}

// uploadDocHandler handles PDF/MD file uploads, embedding and Qdrant storage.
func uploadDocHandler(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        file, header, err := c.Request.FormFile("file")
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
            return
        }
        defer file.Close()
        ext := strings.ToLower(filepath.Ext(header.Filename))
        var text string

        switch ext {
        case ".pdf":
            var readerAt io.ReaderAt
            if ra, ok := file.(io.ReaderAt); ok {
                readerAt = ra
            } else {
                data, _ := ioutil.ReadAll(file)
                readerAt = bytes.NewReader(data)
            }
            r, _ := pdf.NewReader(readerAt, header.Size)
            var sb strings.Builder
            for i := 1; i <= r.NumPage(); i++ {
                pg := r.Page(i)
                if pg.V.IsNull() {
                    continue
                }
                // Extract text content from the page
                content := pg.Content()
                for _, t := range content.Text {
                    sb.WriteString(t.S)
                    sb.WriteString(" ")
                }
            }
            text = sb.String()

        case ".md", ".markdown":
            data, _ := ioutil.ReadAll(file)
            text = string(data)

        default:
            c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file type"})
            return
        }

        // Chunk text
        tokenizer, _ := english.NewSentenceTokenizer(nil)
        sentences := tokenizer.Tokenize(text)
        const maxSentences = 20
        var chunks []string
        var sb strings.Builder
        for i, s := range sentences {
            sb.WriteString(s.Text)
            sb.WriteString(" ")
            if (i+1)%maxSentences == 0 {
                chunks = append(chunks, sb.String())
                sb.Reset()
            }
        }
        if sb.Len() > 0 {
            chunks = append(chunks, sb.String())
        }

        // Embeddings and Qdrant upsert
        client := qdrant.NewClient(cfg.QdrantURL, qdrant.WithAPIKey(cfg.QdrantAPIKey))
        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()

        var points []*qdrant.PointStruct
        for _, chunk := range chunks {
            vec := []float64{} // stub
            points = append(points, &qdrant.PointStruct{
                ID:      uuid.NewString(),
                Vector:  vec,
                Payload: map[string]interface{}{"text": chunk},
            })
        }

        client.Upsert(ctx, &qdrant.UpsertPoints{
            CollectionName: cfg.QdrantCollection,
            Points:         points,
        })

        c.JSON(http.StatusOK, gin.H{"inserted": len(points)})
    }
}
