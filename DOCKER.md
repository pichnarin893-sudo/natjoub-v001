# Docker Development Guide - NatJoub Backend

Complete guide for Docker-based development and deployment of the NatJoub room booking platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Architecture](#docker-architecture)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [CI/CD Setup](#cicd-setup)
- [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

- **Docker Desktop** >= 24.0.0 or **Docker Engine** >= 24.0.0
- **Docker Compose** >= 2.20.0
- **Git** >= 2.30.0

### Verify Installation

```bash
# Check Docker version
docker --version
# Output: Docker version 24.x.x

# Check Docker Compose version
docker-compose --version
# Output: Docker Compose version 2.x.x

# Verify Docker is running
docker ps
# Should list running containers (or empty table if none running)
```

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 10GB free
- **OS**: Linux, macOS, or Windows with WSL2

---

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd NatJoub-backend

# Create environment file from template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 2. Start Development Environment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker-compose ps
```

### 3. Access Services

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5435 (host) or db:5432 (container)
- **pgAdmin**: http://localhost:5050
  - Email: `admin@natjoub.com` (or your `PGADMIN_EMAIL`)
  - Password: `admin123` (or your `PGADMIN_PASSWORD`)

### 4. Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: Deletes database data)
docker-compose down -v
```

---

## Docker Architecture

### Multi-Stage Dockerfile

Our Dockerfile uses four stages for optimization:

```
┌─────────────┐
│ base        │ - Node.js 20 Alpine, dumb-init, working directory
└─────┬───────┘
      │
      ├─> development   - Dev dependencies, hot-reload
      │
      ├─> production-deps - Production dependencies only
      │
      └─> production    - Minimal image, non-root user, healthcheck
```

#### Stage 1: Base
- Node.js 20 Alpine (smallest image)
- dumb-init for proper signal handling
- Package files copied for dependency installation

#### Stage 2: Development
- All dependencies (including devDependencies)
- Source code mounted as volume for hot-reload
- Runs with nodemon for auto-restart
- Includes debugging tools

#### Stage 3: Production-deps
- Only production dependencies
- Excludes devDependencies for smaller size
- Used as intermediate stage

#### Stage 4: Production
- Minimal final image
- Non-root user (nodejs:nodejs)
- Health check configuration
- Optimized for security and size

### Service Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Network                  │
│            natjoub-network                   │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   app    │  │    db    │  │ pgadmin  │  │
│  │  Node.js │◄─┤PostgreSQL│◄─┤    UI    │  │
│  │  :3000   │  │  :5432   │  │  :5050   │  │
│  └────┬─────┘  └──────────┘  └──────────┘  │
│       │                                      │
└───────┼──────────────────────────────────────┘
        │
        ▼
   Host Port 3000
```

---

## Development Workflow

### Starting Development

```bash
# Start all services in detached mode
docker-compose up -d

# Watch logs from all services
docker-compose logs -f

# Watch logs from specific service
docker-compose logs -f app
```

### Hot Reload Development

Changes to your source code are automatically detected:

```bash
# Edit any file in your project
vim index.js

# Nodemon automatically restarts the server
# Check logs to see restart
docker-compose logs -f app
```

### Running Database Migrations

Migrations run automatically on startup if `MIGRATE=true` in `.env`.

To run manually:

```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Rollback migrations
docker-compose exec app npm run db:migrate:undo

# Run seeders
docker-compose exec app npm run db:seed

# Rollback seeders
docker-compose exec app npm run db:seed:undo
```

### Accessing Container Shell

```bash
# Access app container shell
docker-compose exec app sh

# Access database shell
docker-compose exec db psql -U postgres -d net_joub_v1

# Access as root (for debugging)
docker-compose exec -u root app sh
```

### Installing New Dependencies

```bash
# Option 1: Install in container (changes lost on rebuild)
docker-compose exec app npm install <package-name>

# Option 2: Install locally and rebuild (RECOMMENDED)
npm install <package-name>
docker-compose up -d --build
```

### Viewing Database with pgAdmin

1. Open http://localhost:5050
2. Login with credentials from `.env`
3. Add new server:
   - **Name**: NatJoub Dev
   - **Host**: `db` (service name)
   - **Port**: `5432`
   - **Username**: Your `DB_USER`
   - **Password**: Your `DB_PASS`

---

## Production Deployment

### Building Production Image

```bash
# Build production image
docker build -t natjoub-backend:latest --target production .

# Run production container
docker run -d \
  --name natjoub-api \
  -p 3000:3000 \
  --env-file .env.production \
  natjoub-backend:latest
```

### Using Production Compose File

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production stack
docker-compose -f docker-compose.prod.yml down
```

### Production Environment Variables

Create `.env.production`:

```bash
# Copy from example
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Important Production Settings:**
- Set `NODE_ENV=production`
- Use strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Set `RUN_MIGRATIONS=false` (run manually after verification)
- Configure production database credentials
- Set appropriate CORS origins

---

## Common Commands

### Docker Compose Commands

```bash
# Start services
docker-compose up -d                    # Detached mode
docker-compose up --build              # Rebuild images
docker-compose up -d --force-recreate  # Force recreate containers

# Stop services
docker-compose stop                    # Stop containers
docker-compose down                    # Stop and remove containers
docker-compose down -v                 # Stop, remove containers and volumes

# View status
docker-compose ps                      # List containers
docker-compose top                     # Display running processes
docker-compose logs -f                 # Follow logs
docker-compose logs -f app             # Follow specific service

# Execute commands
docker-compose exec app sh             # Shell into app container
docker-compose exec app npm test       # Run tests
docker-compose exec db psql -U postgres # PostgreSQL shell

# Rebuild services
docker-compose build                   # Build all services
docker-compose build app               # Build specific service
docker-compose build --no-cache        # Build without cache
```

### Docker Commands

```bash
# Images
docker images                          # List images
docker rmi <image-id>                  # Remove image
docker image prune                     # Remove unused images
docker image prune -a                  # Remove all unused images

# Containers
docker ps                              # List running containers
docker ps -a                           # List all containers
docker stop <container-id>             # Stop container
docker rm <container-id>               # Remove container
docker logs <container-id>             # View logs
docker exec -it <container-id> sh      # Shell into container

# Volumes
docker volume ls                       # List volumes
docker volume rm <volume-name>         # Remove volume
docker volume prune                    # Remove unused volumes

# Networks
docker network ls                      # List networks
docker network inspect natjoub-network # Inspect network

# System cleanup
docker system df                       # Show disk usage
docker system prune                    # Remove unused data
docker system prune -a --volumes       # Remove everything unused
```

### Application Commands (Inside Container)

```bash
# Database
npm run db:migrate                     # Run migrations
npm run db:migrate:undo               # Rollback migrations
npm run db:seed                        # Run seeders
npm run db:seed:undo                  # Rollback seeders

# Development
npm run dev                            # Start dev server
npm test                               # Run tests
npm start                              # Start production server
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `bind: address already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

#### 2. Database Connection Failed

**Error**: `Connection refused` or `ECONNREFUSED`

**Solution**:
```bash
# Check if database is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database service
docker-compose restart db

# Verify environment variables
docker-compose exec app env | grep DB_
```

#### 3. Migrations Not Running

**Error**: Migrations don't run on startup

**Solution**:
```bash
# Check MIGRATE environment variable
docker-compose exec app env | grep MIGRATE

# Manually run migrations
docker-compose exec app npm run db:migrate

# Check migration logs
docker-compose logs app | grep migration
```

#### 4. Hot Reload Not Working

**Issue**: Changes not reflecting in container

**Solution**:
```bash
# Verify volume mounts
docker-compose config | grep volumes

# Check if nodemon is running
docker-compose exec app ps aux | grep nodemon

# Restart service
docker-compose restart app
```

#### 5. Permission Denied Errors

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run as root temporarily
docker-compose exec -u root app chown -R node:node /usr/src/app
```

#### 6. Out of Disk Space

**Error**: `no space left on device`

**Solution**:
```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes

# Remove specific unused images
docker image prune -a

# Remove stopped containers
docker container prune
```

### Debugging Tips

#### View Container Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats natjoub-backend-dev
```

#### Inspect Container Configuration

```bash
# Full container details
docker inspect natjoub-backend-dev

# Network settings
docker inspect natjoub-backend-dev | grep -A 20 NetworkSettings
```

#### Check Health Status

```bash
# View health check results
docker inspect --format='{{json .State.Health}}' natjoub-backend-prod | jq
```

#### Debug Network Issues

```bash
# Test connectivity from app to db
docker-compose exec app ping db

# Check if database port is accessible
docker-compose exec app nc -zv db 5432

# Inspect network
docker network inspect natjoub-network
```

---

## CI/CD Setup

### GitHub Actions Configuration

We have two workflows configured:

1. **Development Workflow** (`.github/workflows/dev.yml`)
   - Triggers on push to `dev`/`development` branches
   - Runs tests
   - Builds Docker image
   - Pushes to GitHub Container Registry
   - Deploys to development server (optional)

2. **Production Workflow** (`.github/workflows/production.yml`)
   - Triggers on push to `main`/`master` branches
   - Includes security scanning
   - Runs full test suite
   - Builds multi-platform images
   - Deploys to production (with rollback capability)

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

#### Development Secrets

```
DEV_DB_USER          # Development database username
DEV_DB_PASS          # Development database password
DEV_DB_NAME          # Development database name
DEV_DB_HOST          # Development database host
DEV_DB_PORT          # Development database port
DEV_SERVER_HOST      # Development server IP/hostname
DEV_SERVER_USER      # SSH username for dev server
DEV_SERVER_SSH_KEY   # SSH private key for dev server
DEV_SERVER_PORT      # SSH port (default: 22)
```

#### Production Secrets

```
PROD_DB_USER         # Production database username
PROD_DB_PASS         # Production database password
PROD_DB_NAME         # Production database name
PROD_DB_HOST         # Production database host
PROD_DB_PORT         # Production database port
PROD_SERVER_HOST     # Production server IP/hostname
PROD_SERVER_USER     # SSH username for prod server
PROD_SERVER_SSH_KEY  # SSH private key for prod server
PROD_SERVER_PORT     # SSH port (default: 22)
SLACK_WEBHOOK_URL    # Slack webhook for notifications (optional)
```

### Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the appropriate value

### Docker Registry Authentication

The workflows automatically use `GITHUB_TOKEN` to authenticate with GitHub Container Registry (ghcr.io).

To use Docker Hub instead:

1. Create Docker Hub account
2. Generate access token in Docker Hub
3. Add secrets to GitHub:
   ```
   DOCKERHUB_USERNAME
   DOCKERHUB_TOKEN
   ```
4. Update workflow files to use Docker Hub

### Testing CI/CD Locally

Use [act](https://github.com/nektos/act) to test GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or download from GitHub releases

# Run workflow
act -j test

# Run specific workflow
act -W .github/workflows/dev.yml
```

---

## Best Practices

### Security

1. **Never commit secrets**
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   echo ".env.*" >> .gitignore
   ```

2. **Use secrets management in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker Secrets (Swarm mode)

3. **Run as non-root user**
   - Production Dockerfile already configured
   - Never use `USER root` in production

4. **Keep base images updated**
   ```bash
   # Regularly pull latest images
   docker pull node:20-alpine
   docker-compose build --no-cache
   ```

5. **Scan for vulnerabilities**
   ```bash
   # Install Trivy
   brew install trivy  # macOS

   # Scan Dockerfile
   trivy config .

   # Scan image
   trivy image natjoub-backend:latest
   ```

### Performance

1. **Use layer caching effectively**
   - Copy package files before source code
   - Use `.dockerignore` to exclude unnecessary files

2. **Optimize image size**
   ```bash
   # Check image sizes
   docker images natjoub-backend

   # Use Alpine base images
   # Use multi-stage builds
   # Remove unnecessary dependencies
   ```

3. **Use Docker BuildKit**
   ```bash
   # Enable BuildKit
   export DOCKER_BUILDKIT=1

   # Or in docker-compose.yml
   COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build
   ```

4. **Configure resource limits**
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
   ```

### Development

1. **Use volume mounts for development**
   - Enables hot-reload
   - Keep node_modules in container

2. **Use named volumes for data persistence**
   ```yaml
   volumes:
     postgres_data:
       driver: local
   ```

3. **Use health checks**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

4. **Use Docker Compose profiles** (for optional services)
   ```yaml
   services:
     pgadmin:
       profiles: ["tools"]

   # Start with profile
   docker-compose --profile tools up -d
   ```

### Maintenance

1. **Regular cleanup**
   ```bash
   # Weekly cleanup script
   docker system prune -f
   docker volume prune -f
   docker image prune -a -f
   ```

2. **Monitor disk usage**
   ```bash
   # Check disk usage
   docker system df

   # Check volume sizes
   docker system df -v
   ```

3. **Backup database**
   ```bash
   # Backup PostgreSQL
   docker-compose exec db pg_dump -U postgres net_joub_v1 > backup.sql

   # Restore from backup
   docker-compose exec -T db psql -U postgres net_joub_v1 < backup.sql
   ```

4. **Update dependencies**
   ```bash
   # Update npm packages
   npm update

   # Rebuild with updated dependencies
   docker-compose up -d --build
   ```

---

## Additional Resources

### Official Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Tools

- [Dive](https://github.com/wagoodman/dive) - Docker image layer analysis
- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter
- [Trivy](https://github.com/aquasecurity/trivy) - Vulnerability scanner
- [act](https://github.com/nektos/act) - Run GitHub Actions locally

### Learning

- [Docker Tutorial](https://docker-curriculum.com/)
- [Play with Docker](https://labs.play-with-docker.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker-compose logs -f`
3. Open an issue in the repository
4. Contact the development team

---

**Last Updated**: 2025-12-05
**Docker Version**: 24.0+
**Docker Compose Version**: 2.20+
