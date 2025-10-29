# FinSmartAI Production Deployment Guide

This guide provides comprehensive instructions for deploying FinSmartAI in a production environment using Docker containers.

## Prerequisites

Before deploying, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 1.29 or higher)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Make](https://www.gnu.org/software/make/) (optional, for convenience)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd finsmartai
```

### 2. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production .env

# Edit the environment file with your configuration
nano .env
```

### 3. Deploy the Application

```bash
# Run the deployment script
./scripts/deployment/deploy.sh
```

### 4. Verify Deployment

```bash
# Check service status
./scripts/deployment/deploy.sh status

# View logs
./scripts/deployment/deploy.sh logs
```

## Detailed Deployment Process

### Environment Configuration

The application requires several environment variables to be configured. Edit the `.env` file with your specific settings:

#### Required Variables

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database Configuration
DATABASE_URL=file:/app/data/custom.db

# Redis Configuration
REDIS_URL=redis://redis:6379

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key

# AI Service Configuration
AI_API_KEY=your-ai-api-key
```

#### Optional Variables

```bash
# Security Configuration
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Payment Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 */6 * * *
S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### SSL/TLS Configuration

For production deployment, SSL/TLS is required. You have several options:

#### Option 1: Nginx with Let's Encrypt

1. Generate SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com
```

2. Copy certificates to the SSL directory:

```bash
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown -R $USER:$USER ./ssl
```

3. Uncomment the HTTPS section in `nginx.conf`

#### Option 2: Cloudflare SSL

1. Configure your domain in Cloudflare
2. Set SSL mode to "Full" or "Full (strict)"
3. Use Cloudflare origin certificates

### Database Setup

The application uses SQLite with Prisma ORM. The database will be automatically created and migrated during deployment.

### Deployment Scripts

The deployment process is automated using the following scripts:

#### Main Deployment Script

```bash
./scripts/deployment/deploy.sh [command]
```

Available commands:
- `deploy` - Deploy the application (default)
- `rollback` - Rollback to previous deployment
- `status` - Show service status
- `logs` - Show recent logs
- `backup` - Create backup only

#### Docker Build Script

```bash
./scripts/deployment/docker-build.sh [version] [platform]
```

Examples:
```bash
# Build with default settings
./scripts/deployment/docker-build.sh

# Build specific version
./scripts/deployment/docker-build.sh v1.0.0

# Build for specific platform
./scripts/deployment/docker-build.sh v1.0.0 linux/amd64
```

#### Monitoring Setup Script

```bash
./scripts/deployment/monitoring-setup.sh [admin_password] [command]
```

Available commands:
- `setup` - Complete monitoring setup (default)
- `start` - Start monitoring services only
- `config` - Create configuration files only
- `dashboards` - Create Grafana dashboards only

## Service Architecture

The application consists of the following services:

### Core Services

1. **App Service** (`finsmartai-app`)
   - Next.js application server
   - Socket.IO for real-time features
   - Port: 3000

2. **Redis Service** (`finsmartai-redis`)
   - Caching and session storage
   - Port: 6379

### Optional Services

3. **Nginx Service** (`finsmartai-nginx`)
   - Reverse proxy and load balancer
   - SSL termination
   - Port: 80, 443

4. **Backup Service** (`finsmartai-backup`)
   - Automated database backups
   - S3 integration

5. **Monitoring Services**
   - **Prometheus** (`finsmartai-prometheus`)
     - Metrics collection
     - Port: 9090
   - **Grafana** (`finsmartai-grafana`)
     - Dashboard and visualization
     - Port: 3001

## Production Deployment

### Using Docker Compose

#### Basic Deployment

```bash
# Deploy core services only
docker-compose up -d

# Deploy with proxy
docker-compose --profile proxy up -d

# Deploy with monitoring
docker-compose --profile monitoring up -d

# Deploy with backup
docker-compose --profile backup up -d

# Deploy all services
docker-compose --profile proxy --profile monitoring --profile backup up -d
```

#### Scaling Services

```bash
# Scale the app service
docker-compose up -d --scale app=3

# Scale with specific profiles
docker-compose --profile proxy up -d --scale app=3
```

### Using the Deployment Script

```bash
# Full deployment with all services
./scripts/deployment/deploy.sh

# Deploy with specific configuration
./scripts/deployment/deploy.sh
```

## Monitoring and Logging

### Application Monitoring

The application includes comprehensive monitoring:

1. **Health Checks**
   - Endpoint: `/health`
   - Returns application status and metrics

2. **Metrics Collection**
   - HTTP request metrics
   - Response time tracking
   - Error rate monitoring
   - System resource usage

3. **Logging**
   - Structured logging with Winston
   - Log rotation and retention
   - Error tracking with Sentry

### Infrastructure Monitoring

1. **Prometheus**
   - Metrics collection and storage
   - Alerting rules
   - Query language (PromQL)

2. **Grafana**
   - Dashboards and visualization
   - Alert notifications
   - User management

### Accessing Monitoring

- **Grafana**: http://localhost:3001 (admin: admin)
- **Prometheus**: http://localhost:9090
- **Application Health**: http://localhost:3000/health

## Backup and Recovery

### Automated Backups

The backup service provides:

1. **Database Backups**
   - Scheduled backups (every 6 hours by default)
   - Compression and encryption
   - S3 integration for cloud storage

2. **File Backups**
   - Configuration files
   - SSL certificates
   - Application data

### Manual Backup

```bash
# Create manual backup
./scripts/deployment/deploy.sh backup

# View backup status
ls -la ./backups/
```

### Recovery

```bash
# Rollback to previous deployment
./scripts/deployment/deploy.sh rollback

# Restore from specific backup
# (Manual process - contact administrator)
```

## Security Considerations

### Network Security

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSL/TLS**
   - Always use HTTPS in production
   - Keep certificates updated
   - Use strong cipher suites

### Application Security

1. **Environment Variables**
   - Never commit secrets to version control
   - Use environment-specific configurations
   - Rotate secrets regularly

2. **Rate Limiting**
   - API endpoints: 100 requests per minute
   - Auth endpoints: 5 requests per minute
   - Configurable per environment

3. **Headers**
   - Security headers (CSP, XSS protection, etc.)
   - CORS configuration
   - Content type validation

### Database Security

1. **Access Control**
   - Limited database permissions
   - Connection encryption
   - Regular access reviews

2. **Backup Security**
   - Encrypted backups
   - Secure storage (S3 with proper ACLs)
   - Regular backup testing

## Performance Optimization

### Application Optimization

1. **Caching Strategy**
   - Redis for session storage
   - Application-level caching
   - CDN for static assets

2. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Regular maintenance

3. **Resource Management**
   - Memory limits
   - CPU allocation
   - Auto-scaling configuration

### Infrastructure Optimization

1. **Load Balancing**
   - Nginx configuration
   - Health checks
   - Session persistence

2. **Content Delivery**
   - Static asset optimization
   - Image compression
   - Browser caching

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
docker-compose logs app

# Check service status
docker-compose ps

# Restart services
docker-compose restart app
```

#### 2. Database Connection Issues

```bash
# Check database file
ls -la ./data/

# Check database permissions
ls -la ./data/custom.db

# Reset database
docker-compose exec app npm run db:reset
```

#### 3. High Memory Usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart

# Check logs for memory leaks
docker-compose logs app | grep -i memory
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ./ssl/cert.pem -text -noout

# Renew certificates
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

### Debug Mode

```bash
# Enable debug logging
echo "LOG_LEVEL=debug" >> .env
docker-compose restart app

# View debug logs
docker-compose logs -f app
```

## Maintenance

### Regular Tasks

1. **Daily**
   - Check application health
   - Review error logs
   - Monitor resource usage

2. **Weekly**
   - Update dependencies
   - Review security patches
   - Test backup restoration

3. **Monthly**
   - Performance review
   - Security audit
   - Capacity planning

### Updates and Upgrades

1. **Application Updates**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Update dependencies
   npm install
   
   # Rebuild and deploy
   ./scripts/deployment/deploy.sh
   ```

2. **System Updates**
   ```bash
   # Update Docker images
   docker-compose pull
   
   # Rebuild services
   docker-compose up -d --build
   ```

## Support

For support and assistance:

1. **Documentation**
   - API documentation: `/docs`
   - System logs: `./logs/`
   - Monitoring dashboards: Grafana

2. **Community**
   - GitHub Issues
   - Discussion forums
   - Stack Overflow

3. **Emergency Contact**
   - System administrator
   - DevOps team
   - Security team

## Conclusion

This deployment guide provides a comprehensive approach to deploying FinSmartAI in production. By following these guidelines, you can ensure a secure, performant, and maintainable deployment.

For additional information or assistance, please refer to the project documentation or contact the support team.