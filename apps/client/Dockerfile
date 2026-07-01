# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Use the Node alpine official image
FROM node:lts-alpine AS build

# Set config
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Create and change to the app directory
WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install all packages (npm install instead of npm ci to handle
# platform-specific optional deps that macOS lock files omit)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . ./

# Build the Vite app — outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve with Caddy ────────────────────────────────────────────────
FROM caddy

# Set working directory
WORKDIR /app

# Copy Caddyfile
COPY Caddyfile ./

# Validate and format Caddyfile
RUN caddy fmt Caddyfile --overwrite

# Copy built static files from build stage
COPY --from=build /app/dist ./dist

# Start Caddy
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
