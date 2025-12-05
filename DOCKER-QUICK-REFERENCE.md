# Docker Quick Reference - NatJoub Backend

Quick commands for common Docker operations. For detailed documentation, see [DOCKER.md](DOCKER.md).

## 🚀 Quick Start

```bash
# First time setup
cp .env.example .env
nano .env  # Configure your environment

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## 📋 Common Commands

### Development

```bash
# Start services
docker-compose up -d                    # Start in background
docker-compose up                       # Start with logs

# Stop services
docker-compose stop                     # Stop containers
docker-compose down                     # Stop and remove containers
docker-compose down -v                  # Stop, remove, and delete data

# View logs
docker-compose logs -f                  # All services
docker-compose logs -f app              # Just backend
docker-compose logs -f db               # Just database

# Restart services
docker-compose restart                  # All services
docker-compose restart app              # Just backend

# Rebuild
docker-compose up -d --build            # Rebuild and start
docker-compose build --no-cache         # Rebuild from scratch
```

### Database Operations

```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Rollback migrations
docker-compose exec app npm run db:migrate:undo

# Run seeders
docker-compose exec app npm run db:seed

# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d net_joub_v1

# Backup database
docker-compose exec db pg_dump -U postgres net_joub_v1 > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres net_joub_v1 < backup.sql
```

### Shell Access

```bash
# Access app container
docker-compose exec app sh

# Access as root
docker-compose exec -u root app sh

# Run command in container
docker-compose exec app npm test
docker-compose exec app npm install <package>
```

### Monitoring

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# View processes
docker-compose top
```

### Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes

# Check disk usage
docker system df
```

## 🔧 Production

```bash
# Build production image
docker build -t natjoub-backend:latest --target production .

# Run production stack
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production
docker-compose -f docker-compose.prod.yml down
```

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:3000 | - |
| PostgreSQL | localhost:5435 | See .env |
| pgAdmin | http://localhost:5050 | See .env |

## 🐛 Troubleshooting

```bash
# Port already in use?
lsof -i :3000                           # Find process
docker-compose down                     # Stop containers

# Database not connecting?
docker-compose logs db                  # Check DB logs
docker-compose restart db               # Restart DB

# Changes not reflecting?
docker-compose restart app              # Restart app
docker-compose up -d --build           # Rebuild

# Out of space?
docker system prune -a --volumes       # Clean everything
docker system df                       # Check usage

# Container won't start?
docker-compose logs app                # Check logs
docker-compose config                  # Validate config
docker-compose ps -a                   # Check status
```

## 📦 Dependencies

```bash
# Add new package
npm install <package>
docker-compose up -d --build

# Update packages
npm update
docker-compose up -d --build

# Remove package
npm uninstall <package>
docker-compose up -d --build
```

## 🧪 Testing

```bash
# Run tests in container
docker-compose exec app npm test

# Run with coverage
docker-compose exec app npm test -- --coverage

# Run specific test
docker-compose exec app npm test -- <test-file>
```

## 🔐 Environment Variables

```bash
# View current environment
docker-compose exec app env

# Check specific variable
docker-compose exec app env | grep DB_

# Reload after changing .env
docker-compose up -d --force-recreate
```

## 📊 Health Checks

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' natjoub-backend-dev

# Test database connection
docker-compose exec app node -e "require('./config/db.test.connection').testConnection()"

# Test API endpoint
curl http://localhost:3000/
```

## 🔄 CI/CD

```bash
# Push to dev branch (triggers dev workflow)
git push origin dev

# Push to main branch (triggers production workflow)
git push origin main

# View workflow runs
# Go to GitHub → Actions tab
```

## 📖 Documentation

- Full guide: [DOCKER.md](DOCKER.md)
- Project README: [README.md](README.md)
- Claude guide: [CLAUDE.md](CLAUDE.md)
- API docs: [docs/](docs/)

## ⚡ Power User Tips

```bash
# Tail logs with grep
docker-compose logs -f | grep ERROR

# Execute SQL query
docker-compose exec db psql -U postgres -d net_joub_v1 -c "SELECT * FROM users LIMIT 5;"

# Copy file from container
docker cp natjoub-backend-dev:/usr/src/app/logs/app.log ./local-logs/

# Copy file to container
docker cp ./local-file.txt natjoub-backend-dev:/usr/src/app/

# Check container IP
docker inspect natjoub-backend-dev | grep IPAddress

# Follow logs with timestamps
docker-compose logs -f --timestamps

# Recreate single service
docker-compose up -d --no-deps --build app
```

## 🆘 Emergency Commands

```bash
# Force stop everything
docker-compose kill

# Remove everything (nuclear option)
docker-compose down -v --remove-orphans
docker system prune -a --volumes -f

# Reset to fresh state
docker-compose down -v
docker system prune -a -f
cp .env.example .env
docker-compose up -d --build
```

---

**Need more help?** See [DOCKER.md](DOCKER.md) or contact the team.
