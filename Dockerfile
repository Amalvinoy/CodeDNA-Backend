# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript output and required data
COPY --from=builder /app/dist ./dist
COPY data ./data

# Security: run as non-root node user
USER node

EXPOSE 8080

CMD ["node", "dist/server.js"]
