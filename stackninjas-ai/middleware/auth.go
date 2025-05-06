package middleware

import (
    "fmt"
    "net/http"
    "strings"
    "time"

    "stackninjas-ai/config"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v4"
    "github.com/MicahParks/keyfunc"
)

var jwks *keyfunc.JWKS

// InitJWKs initializes the JWKS from the Keycloak server.
func InitJWKs(cfg *config.Config) error {
    options := keyfunc.Options{
        RefreshErrorHandler: func(err error) {
            fmt.Printf("error refreshing JWKS: %v\n", err)
        },
        RefreshInterval:   time.Hour,
        RefreshUnknownKID: true,
    }
    var err error
    jwks, err = keyfunc.Get(cfg.JwksURL, options)
    return err
}

// AdminRoleMiddleware ensures the authenticated user has the 'admin' realm role.
func AdminRoleMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        rolesI, exists := c.Get("roles")
        if !exists {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
            return
        }
        roles, ok := rolesI.([]string)
        if !ok {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
            return
        }
        for _, r := range roles {
            if r == "admin" {
                c.Next()
                return
            }
        }
        c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
    }
}

// AuthMiddleware returns a Gin middleware that validates JWT tokens.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
            return
        }
        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
            return
        }
        tokenString := parts[1]
        token, err := jwt.Parse(tokenString, jwks.Keyfunc)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            return
        }
        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok || !token.Valid {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
            return
        }
        if !claims.VerifyIssuer(cfg.Issuer, true) {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token issuer"})
            return
        }
        aud, ok := claims["aud"]
        if !ok {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token audience"})
            return
        }
        switch v := aud.(type) {
        case string:
            if v != cfg.ClientID {
                c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token audience"})
                return
            }
        case []interface{}:
            valid := false
            for _, a := range v {
                if aStr, ok := a.(string); ok && aStr == cfg.ClientID {
                    valid = true
                    break
                }
            }
            if !valid {
                c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token audience"})
                return
            }
        default:
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token audience"})
            return
        }
        if sub, ok := claims["sub"].(string); ok {
            c.Set("user", sub)
        }
        // Extract roles from realm_access claim, if present
        if ra, ok := claims["realm_access"].(map[string]interface{}); ok {
            if arr, ok := ra["roles"].([]interface{}); ok {
                var roles []string
                for _, v := range arr {
                    if s, ok := v.(string); ok {
                        roles = append(roles, s)
                    }
                }
                c.Set("roles", roles)
            }
        }
        c.Next()
    }
}
