FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Render uses dynamic PORT; expose it
EXPOSE 10000

CMD ["node", "dist/index.js"]
