# Build stage
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o api

# Final stage
FROM alpine:latest
 
# Install curl for health checking Keycloak
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/api .
COPY wait-for-keycloak.sh .
RUN chmod +x wait-for-keycloak.sh

EXPOSE 8080
# Wait for Keycloak readiness before starting API
ENTRYPOINT ["./wait-for-keycloak.sh"]
