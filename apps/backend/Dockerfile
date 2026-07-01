# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install all deps (including devDependencies needed for build)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Compile TypeScript
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production deps only
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Expose NestJS default port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]
