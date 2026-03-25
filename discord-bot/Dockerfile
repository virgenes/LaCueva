FROM node:20-alpine
# cache-bust: 2026-03-24

WORKDIR /app

# Build tools needed for native modules (better-sqlite3, etc.)
RUN apk add --no-cache python3 make g++

# Install all deps (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Render injects PORT dynamically — no hardcoded EXPOSE needed
# but we expose 3001 as default for local use
EXPOSE 3001

CMD ["node", "dist/index.js"]
