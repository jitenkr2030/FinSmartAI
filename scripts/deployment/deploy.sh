#!/bin/bash

# FinSmartAI Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="finsmartai"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create necessary directories
setup_directories() {
    print_status "Setting up directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./data"
    mkdir -p "./ssl"
    
    print_status "Directories created successfully"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check required commands
    if ! command_exists docker; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check required files
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file not found: .env.production"
        exit 1
    fi
    
    print_status "Environment validation passed"
}

# Function to backup existing data
backup_data() {
    print_status "Creating backup..."
    
    if [ -d "./data" ] && [ "$(ls -A ./data)" ]; then
        BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" ./data/
        print_status "Backup created: $BACKUP_FILE"
    else
        print_warning "No data to backup"
    fi
}

# Function to stop existing services
stop_services() {
    print_status "Stopping existing services..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        print_status "Services stopped"
    else
        print_warning "No running services found"
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Copy production environment file
    cp .env.production .env
    
    # Build and start services
    docker-compose up -d --build
    
    print_status "Services started successfully"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for app to be ready
    sleep 10
    
    # Run Prisma migrations
    docker-compose exec app npm run db:push
    
    # Run database seed if needed
    docker-compose exec app npm run db:seed
    
    print_status "Database migrations completed"
}

# Function to health check
health_check() {
    print_status "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            print_status "Health check passed"
            return 0
        fi
        
        print_warning "Health check attempt $attempt/$max_attempts failed"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to show logs
show_logs() {
    print_status "Recent logs:"
    docker-compose logs --tail=50
}

# Main deployment function
deploy() {
    print_status "Starting FinSmartAI deployment..."
    
    # Validate environment
    validate_environment
    
    # Setup directories
    setup_directories
    
    # Backup existing data
    backup_data
    
    # Stop existing services
    stop_services
    
    # Start services
    start_services
    
    # Run migrations
    run_migrations
    
    # Health check
    if health_check; then
        print_status "Deployment completed successfully!"
        show_status
    else
        print_error "Deployment failed!"
        show_logs
        exit 1
    fi
}

# Function to rollback deployment
rollback() {
    print_status "Starting rollback..."
    
    # Stop current services
    docker-compose down
    
    # Restore from latest backup
    if [ -d "$BACKUP_DIR" ]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/pre-deploy-*.tar.gz | head -n1)
        if [ -n "$LATEST_BACKUP" ]; then
            print_status "Restoring from backup: $LATEST_BACKUP"
            rm -rf ./data
            tar -xzf "$LATEST_BACKUP"
        else
            print_warning "No backup found for rollback"
        fi
    fi
    
    # Restart services
    start_services
    run_migrations
    
    if health_check; then
        print_status "Rollback completed successfully!"
    else
        print_error "Rollback failed!"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    backup)
        backup_data
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|logs|backup}"
        echo "  deploy  - Deploy the application (default)"
        echo "  rollback - Rollback to previous deployment"
        echo "  status  - Show service status"
        echo "  logs    - Show recent logs"
        echo "  backup  - Create backup only"
        exit 1
        ;;
esac