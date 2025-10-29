#!/bin/bash

# Docker Build Script for FinSmartAI
set -e

# Configuration
IMAGE_NAME="finsmartai"
REGISTRY="your-registry-here"  # Change to your registry
VERSION=${1:-latest}
PLATFORM=${2:-linux/amd64,linux/arm64}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build Docker image
build_image() {
    print_status "Building Docker image..."
    
    # Build for multiple platforms
    docker buildx build \
        --platform "$PLATFORM" \
        --tag "$IMAGE_NAME:$VERSION" \
        --tag "$IMAGE_NAME:latest" \
        --push \
        --file Dockerfile \
        .
    
    print_status "Docker image built successfully: $IMAGE_NAME:$VERSION"
}

# Function to build backup service image
build_backup_image() {
    print_status "Building backup service image..."
    
    docker buildx build \
        --platform "$PLATFORM" \
        --tag "$IMAGE_NAME-backup:$VERSION" \
        --tag "$IMAGE_NAME-backup:latest" \
        --push \
        --file Dockerfile.backup \
        .
    
    print_status "Backup service image built successfully: $IMAGE_NAME-backup:$VERSION"
}

# Main build function
build() {
    print_status "Starting Docker build process..."
    print_status "Image: $IMAGE_NAME:$VERSION"
    print_status "Platform: $PLATFORM"
    
    # Check if docker buildx is available
    if ! docker buildx version >/dev/null 2>&1; then
        print_error "Docker Buildx is not available"
        exit 1
    fi
    
    # Initialize buildx builder if needed
    if ! docker buildx inspect default >/dev/null 2>&1; then
        print_status "Initializing Docker Buildx..."
        docker buildx create --use
    fi
    
    # Build main application image
    build_image
    
    # Build backup service image
    build_backup_image
    
    print_status "Docker build process completed successfully!"
}

# Parse command line arguments
case "${1:-build}" in
    build)
        build
        ;;
    *)
        echo "Usage: $0 [version] [platform]"
        echo "  version  - Image version (default: latest)"
        echo "  platform - Target platform (default: linux/amd64,linux/arm64)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Build with default settings"
        echo "  $0 v1.0.0            # Build version v1.0.0"
        echo "  $0 v1.0.0 linux/amd64 # Build for specific platform"
        exit 1
        ;;
esac