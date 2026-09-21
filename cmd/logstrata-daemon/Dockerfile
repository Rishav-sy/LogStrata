# =============================================================================
# Stage 1: Build — Full Go toolchain (CGO disabled for static binary)
# =============================================================================
FROM golang:1.22-bookworm AS builder

WORKDIR /workspace

# Cache dependencies before copying source
COPY go.mod go.sum ./
RUN go mod download

# Copy all Go source
COPY . .

# Build a fully static binary — no libc dependency
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
      -ldflags="-s -w -extldflags '-static'" \
      -trimpath \
      -o /out/logstrata-daemon \
      ./cmd/logstrata-daemon

# =============================================================================
# Stage 2: Runtime — Google Distroless (no shell, no package manager)
# =============================================================================
FROM gcr.io/distroless/static-debian12:nonroot

# Copy the static binary
COPY --from=builder /out/logstrata-daemon /app/logstrata-daemon

# Non-root user (uid=65532 in distroless nonroot)
USER nonroot:nonroot

# Health-check port
EXPOSE 8080

ENTRYPOINT ["/app/logstrata-daemon"]
CMD ["--listen-addr=:8080"]
