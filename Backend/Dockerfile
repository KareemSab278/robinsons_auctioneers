# Backend Dockerfile - builds and packages the Rust Axum API

# Build stage
FROM rust:latest AS builder
WORKDIR /app

# Copy dependency manifests and install dependencies
COPY Cargo.toml Cargo.lock ./
# Copy source
COPY src ./src

# Build the release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libsqlite3-0 \
  && rm -rf /var/lib/apt/lists/*

# Create working directory (this is used by the app to store the SQLite DB file)
WORKDIR /app

# Copy the compiled binary from build stage
COPY --from=builder /app/target/release/backend /usr/local/bin/backend

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/backend"]
