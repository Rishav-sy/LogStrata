# =============================================================================
# Stage 1: Build — Full Go toolchain
# =============================================================================
FROM golang:1.22-bookworm AS builder

WORKDIR /workspace

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
      -ldflags="-s -w -extldflags '-static'" \
      -trimpath \
      -o /out/logstrata-controller \
      ./cmd/logstrata-controller

# =============================================================================
# Stage 2: Runtime — Google Distroless
# =============================================================================
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/logstrata-controller /app/logstrata-controller

# Non-root user
USER nonroot:nonroot

# Controller metrics port
EXPOSE 8081

ENTRYPOINT ["/app/logstrata-controller"]
CMD ["--listen-addr=:8081"]
