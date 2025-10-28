#!/bin/bash

# Monitoring Setup Script for FinSmartAI
set -e

# Configuration
GRAFANA_ADMIN_PASSWORD=${1:-admin}
PROMETHEUS_RETENTION="200h"

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

# Function to setup monitoring services
setup_monitoring() {
    print_status "Setting up monitoring services..."
    
    # Create monitoring directories
    mkdir -p ./monitoring/grafana/dashboards
    mkdir -p ./monitoring/grafana/datasources
    mkdir -p ./monitoring/prometheus/data
    
    # Create Grafana datasource configuration
    cat > ./monitoring/grafana/datasources/datasources.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    orgId: 1
    url: http://prometheus:9090
    basicAuth: false
    isDefault: true
    version: 1
    editable: false
    jsonData:
      httpMethod: POST
      queryTimeout: 60s
      timeInterval: 15s

  - name: Redis
    type: redis
    access: proxy
    orgId: 1
    url: redis://redis:6379
    basicAuth: false
    isDefault: false
    version: 1
    editable: false
    jsonData:
      timeInterval: 15s
EOF

    # Create Prometheus configuration
    cat > ./monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'finsmartai-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/nginx_status'
EOF

    # Create alert rules
    cat > ./monitoring/alert_rules.yml << EOF
groups:
  - name: finsmartai-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ \$value }} seconds"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Service {{ \$labels.instance }} is down"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ \$value }}%"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ \$value }}%"
EOF

    print_status "Monitoring configuration created successfully"
}

# Function to start monitoring services
start_monitoring() {
    print_status "Starting monitoring services..."
    
    # Start monitoring services with specific profile
    docker-compose --profile monitoring up -d
    
    print_status "Monitoring services started"
    print_status "Grafana: http://localhost:3001 (admin: $GRAFANA_ADMIN_PASSWORD)"
    print_status "Prometheus: http://localhost:9090"
}

# Function to create basic Grafana dashboards
create_dashboards() {
    print_status "Creating Grafana dashboards..."
    
    # Create application dashboard
    cat > ./monitoring/grafana/dashboards/application.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "FinSmartAI Application",
    "tags": ["finsmartai"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "yAxes": [{"id": "y", "label": "Requests per second"}]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "yAxes": [{"id": "y", "label": "Seconds"}]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "yAxes": [{"id": "y", "label": "Errors per second"}]
      }
    ]
  }
}
EOF

    # Create system dashboard
    cat > ./monitoring/grafana/dashboards/system.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "System Metrics",
    "tags": ["system"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ],
        "yAxes": [{"id": "y", "label": "Percentage"}]
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "yAxes": [{"id": "y", "label": "Percentage"}]
      },
      {
        "id": 3,
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100",
            "legendFormat": "{{instance}} {{mountpoint}}"
          }
        ],
        "yAxes": [{"id": "y", "label": "Percentage"}]
      }
    ]
  }
}
EOF

    print_status "Grafana dashboards created successfully"
}

# Main setup function
setup() {
    print_status "Starting monitoring setup..."
    
    # Setup monitoring configuration
    setup_monitoring
    
    # Create dashboards
    create_dashboards
    
    # Start monitoring services
    start_monitoring
    
    print_status "Monitoring setup completed successfully!"
    print_status ""
    print_status "Access URLs:"
    print_status "  - Grafana: http://localhost:3001"
    print_status "  - Prometheus: http://localhost:9090"
    print_status ""
    print_status "Default Grafana credentials:"
    print_status "  - Username: admin"
    print_status "  - Password: $GRAFANA_ADMIN_PASSWORD"
}

# Parse command line arguments
case "${1:-setup}" in
    setup)
        setup
        ;;
    start)
        start_monitoring
        ;;
    config)
        setup_monitoring
        ;;
    dashboards)
        create_dashboards
        ;;
    *)
        echo "Usage: $0 [admin_password] {setup|start|config|dashboards}"
        echo "  admin_password - Grafana admin password (default: admin)"
        echo "  setup         - Complete monitoring setup (default)"
        echo "  start         - Start monitoring services only"
        echo "  config        - Create configuration files only"
        echo "  dashboards    - Create Grafana dashboards only"
        exit 1
        ;;
esac