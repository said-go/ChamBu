FROM golang:1.25-alpine AS builder

WORKDIR /app/server
COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/chambu-api ./cmd/api

FROM alpine:3.22

WORKDIR /app
RUN adduser -D -H chambu

COPY --from=builder /out/chambu-api /app/chambu-api
COPY client /app/client

ENV HOST=0.0.0.0
ENV PORT=8080
ENV CLIENT_DIR=/app/client

USER chambu
EXPOSE 8080

CMD ["/app/chambu-api"]
