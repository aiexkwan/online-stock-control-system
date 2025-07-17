# Health Checker Service Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S healthcheck && \
    adduser -S healthcheck -u 1001

# Change ownership
RUN chown -R healthcheck:healthcheck /app

USER healthcheck

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "server.js"]