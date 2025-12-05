# ==========================================
# NatJoub Backend - Multi-Stage Dockerfile
# ==========================================
# This Dockerfile uses multi-stage builds for optimization
# Stages: base, development, production

# ==========================================
# Stage 1: Base Image
# ==========================================
# Use official Node.js LTS (Long Term Support) version
FROM node:20-alpine AS base

# Install dumb-init to handle signals properly (PID 1 problem)
# Add bash for entrypoint scripts
RUN apk add --no-cache dumb-init bash

# Set working directory
WORKDIR /usr/src/app

# Copy package files for dependency installation
# This layer is cached unless package files change
COPY package*.json ./

# ==========================================
# Stage 2: Development
# ==========================================
FROM base AS development

# Set Node environment to development
ENV NODE_ENV=development

# Install ALL dependencies (including devDependencies)
# Use npm ci for reproducible builds (respects package-lock.json)
RUN npm ci

# Copy application source code
COPY . .

# Copy and make entrypoint script executable
COPY scripts/docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose application port
EXPOSE 3000

# Use dumb-init to properly handle signals (SIGTERM, SIGINT)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run entrypoint script then start dev server with nodemon
CMD ["/usr/local/bin/docker-entrypoint.sh", "npm", "run", "dev"]

# ==========================================
# Stage 3: Production Dependencies
# ==========================================
FROM base AS production-deps

# Set Node environment to production
ENV NODE_ENV=production

# Install ONLY production dependencies
# --omit=dev excludes devDependencies
# --ignore-scripts prevents running any install scripts
RUN npm ci --omit=dev --ignore-scripts

# ==========================================
# Stage 4: Production Build
# ==========================================
FROM base AS production

# Set Node environment to production
ENV NODE_ENV=production

# Create non-root user for security
# -r: system user, -s: shell
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from production-deps stage
COPY --from=production-deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Copy and make production entrypoint executable
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.prod.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Add healthcheck
# This tells Docker how to test if container is still working
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to properly handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run entrypoint script then start production server
CMD ["/usr/local/bin/docker-entrypoint.sh", "npm", "start"]
