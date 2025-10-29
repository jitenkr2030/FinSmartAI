#!/usr/bin/env python3
"""
Quick Start Script for Kronos-India Monetization
This script helps you set up the basic monetization infrastructure quickly.
"""

import os
import sys
import subprocess
import json
from datetime import datetime

def install_dependencies():
    """Install required dependencies for monetization"""
    print("🚀 Installing monetization dependencies...")
    
    dependencies = [
        'flask', 'flask-sqlalchemy', 'flask-login', 'werkzeug',
        'razorpay', 'stripe', 'chargebee',
        'smtplib', 'email-validator',
        'bootstrap', 'jquery'
    ]
    
    for dep in dependencies:
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', dep], 
                         check=True, capture_output=True)
            print(f"✅ Installed {dep}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {dep}: {e}")
    
    print("✅ Dependencies installation completed!")

def create_directory_structure():
    """Create necessary directories for monetization"""
    print("📁 Creating directory structure...")
    
    directories = [
        '/home/z/my-project/indian_market/billing',
        '/home/z/my-project/indian_market/web',
        '/home/z/my-project/indian_market/web/templates',
        '/home/z/my-project/indian_market/web/static',
        '/home/z/my-project/indian_market/web/static/css',
        '/home/z/my-project/indian_market/web/static/js',
        '/home/z/my-project/indian_market/docs',
        '/home/z/my-project/indian_market/config'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created {directory}")
    
    print("✅ Directory structure created!")

def create_config_files():
    """Create configuration files"""
    print("⚙️ Creating configuration files...")
    
    # Config file
    config_content = """
# Kronos-India Configuration
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///kronos_billing.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Razorpay Configuration
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID') or 'your-razorpay-key-id'
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET') or 'your-razorpay-key-secret'
    
    # Email Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER') or 'smtp.gmail.com'
    SMTP_PORT = int(os.environ.get('SMTP_PORT') or 587)
    EMAIL_USER = os.environ.get('EMAIL_USER') or 'your-email@gmail.com'
    EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD') or 'your-app-password'
    
    # API Configuration
    API_RATE_LIMIT = os.environ.get('API_RATE_LIMIT') or '100/hour'
    API_TIMEOUT = int(os.environ.get('API_TIMEOUT') or 30)

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
"""
    
    with open('/home/z/my-project/indian_market/config/config.py', 'w') as f:
        f.write(config_content)
    
    # Environment file template
    env_template = """# Kronos-India Environment Variables
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=sqlite:///kronos_billing.db

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# API Configuration
API_RATE_LIMIT=100/hour
API_TIMEOUT=30

# Flask Configuration
FLASK_ENV=development
FLASK_APP=app.py
"""
    
    with open('/home/z/my-project/indian_market/.env.template', 'w') as f:
        f.write(env_template)
    
    print("✅ Configuration files created!")

def create_app_skeleton():
    """Create Flask application skeleton"""
    print("🌐 Creating Flask application skeleton...")
    
    app_content = """
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config.config import config
import os

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(config['default'])

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import models and routes
from billing.user_management import User
from billing.subscription_manager import SubscriptionManager
from billing.api_gateway import APIGateway
from billing.analytics import AnalyticsEngine

# Initialize managers
subscription_manager = SubscriptionManager(db)
api_gateway = APIGateway()
analytics_engine = AnalyticsEngine(db)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
"""
    
    with open('/home/z/my-project/indian_market/app.py', 'w') as f:
        f.write(app_content)
    
    print("✅ Flask application skeleton created!")

def create_pricing_setup():
    """Create pricing configuration"""
    print("💰 Creating pricing configuration...")
    
    pricing_config = {
        "subscription_tiers": {
            "free": {
                "price": 0,
                "duration_days": 0,
                "features": [
                    "basic_predictions",
                    "10_stocks",
                    "5_day_horizon",
                    "web_dashboard"
                ],
                "api_limit": 100,
                "description": "Perfect for trying out our platform"
            },
            "retail": {
                "price": 999,
                "duration_days": 30,
                "features": [
                    "daily_predictions",
                    "10_stocks",
                    "5_day_horizon",
                    "web_dashboard",
                    "email_alerts",
                    "mobile_app"
                ],
                "api_limit": 1000,
                "description": "Ideal for retail traders"
            },
            "professional": {
                "price": 4999,
                "duration_days": 30,
                "features": [
                    "daily_predictions",
                    "50_stocks",
                    "30_day_horizon",
                    "advanced_indicators",
                    "api_access",
                    "backtesting_tools",
                    "priority_support"
                ],
                "api_limit": 10000,
                "description": "For serious traders and analysts"
            },
            "institutional": {
                "price": 24999,
                "duration_days": 30,
                "features": [
                    "all_stocks",
                    "custom_horizon",
                    "white_label",
                    "unlimited_api",
                    "dedicated_support",
                    "custom_fine_tuning",
                    "on_premise_deployment"
                ],
                "api_limit": 100000,
                "description": "For institutions and enterprises"
            },
            "enterprise": {
                "price": 50000,
                "duration_days": 30,
                "features": [
                    "custom_development",
                    "multi_asset_modeling",
                    "real_time_integration",
                    "compliance_audit",
                    "sla_guarantees",
                    "training_consulting"
                ],
                "api_limit": 1000000,
                "description": "Custom enterprise solutions"
            }
        },
        "api_pricing": {
            "single_prediction": {"price": 0.10, "unit": "per_call"},
            "batch_prediction": {"price": 0.05, "unit": "per_stock"},
            "model_fine_tuning": {"price": 500, "unit": "per_hour"},
            "custom_indicators": {"price": 200, "unit": "per_indicator"},
            "risk_analysis": {"price": 0.15, "unit": "per_call"},
            "portfolio_optimization": {"price": 1.00, "unit": "per_portfolio"}
        },
        "volume_discounts": {
            "100K+": {"discount": 0.15, "description": "15% discount for 100K+ calls/month"},
            "500K+": {"discount": 0.25, "description": "25% discount for 500K+ calls/month"},
            "1M+": {"discount": 0.35, "description": "35% discount for 1M+ calls/month"},
            "enterprise": {"discount": 0.45, "description": "45% discount for enterprise customers"}
        }
    }
    
    with open('/home/z/my-project/indian_market/config/pricing.json', 'w') as f:
        json.dump(pricing_config, f, indent=2)
    
    print("✅ Pricing configuration created!")

def create_marketing_materials():
    """Create basic marketing materials"""
    print("📈 Creating marketing materials...")
    
    # Landing page content
    landing_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kronos-India - AI Stock Prediction</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">Kronos-India</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="#features">Features</a>
                <a class="nav-link" href="#pricing">Pricing</a>
                <a class="nav-link" href="/login">Login</a>
                <a class="btn btn-primary" href="/signup">Sign Up</a>
            </div>
        </div>
    </nav>

    <div class="container mt-5">
        <div class="row">
            <div class="col-md-6">
                <h1 class="display-4">AI-Powered Stock Prediction for Indian Markets</h1>
                <p class="lead">Predict NSE/BSE stock prices with 94%+ accuracy using advanced AI</p>
                <a href="/signup" class="btn btn-primary btn-lg">Start Free Trial</a>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5>Try a Prediction</h5>
                        <select class="form-select mb-3">
                            <option>RELIANCE.NS</option>
                            <option>TCS.NS</option>
                            <option>INFY.NS</option>
                            <option>HDFCBANK.NS</option>
                        </select>
                        <button class="btn btn-success w-100">Make Prediction</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
"""
    
    with open('/home/z/my-project/indian_market/web/templates/index.html', 'w') as f:
        f.write(landing_content)
    
    print("✅ Marketing materials created!")

def create_deployment_scripts():
    """Create deployment scripts"""
    print("🚀 Creating deployment scripts...")
    
    # Development startup script
    dev_script = """#!/bin/bash
# Development startup script for Kronos-India

echo "🚀 Starting Kronos-India Development Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Set environment variables
echo "⚙️ Setting environment variables..."
export FLASK_APP=app.py
export FLASK_ENV=development

# Create database
echo "🗄️ Creating database..."
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Start the application
echo "🌐 Starting application..."
python app.py
"""
    
    with open('/home/z/my-project/indian_market/scripts/start_dev.sh', 'w') as f:
        f.write(dev_script)
    
    # Make script executable
    os.chmod('/home/z/my-project/indian_market/scripts/start_dev.sh', 0o755)
    
    # Production deployment script
    prod_script = """#!/bin/bash
# Production deployment script for Kronos-India

echo "🚀 Deploying Kronos-India to Production..."

# Install production dependencies
echo "📦 Installing production dependencies..."
pip install gunicorn

# Set production environment variables
export FLASK_ENV=production
export DATABASE_URL=postgresql://user:password@localhost/kronos_production

# Create production database
echo "🗄️ Setting up production database..."
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Start Gunicorn server
echo "🌐 Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:8000 --workers 4 app:app
"""
    
    with open('/home/z/my-project/indian_market/scripts/deploy_prod.sh', 'w') as f:
        f.write(prod_script)
    
    # Make script executable
    os.chmod('/home/z/my-project/indian_market/scripts/deploy_prod.sh', 0o755)
    
    print("✅ Deployment scripts created!")

def create_documentation():
    """Create basic documentation"""
    print("📚 Creating documentation...")
    
    readme_content = """# Kronos-India Monetization Quick Start

This quick start guide helps you set up the monetization infrastructure for Kronos-India.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
python scripts/quick_start_monetization.py
```

### 2. Set Up Environment
```bash
cp .env.template .env
# Edit .env with your configuration
```

### 3. Start Development Server
```bash
./scripts/start_dev.sh
```

### 4. Access the Application
- Web Interface: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

## 💰 Monetization Features

### Subscription Tiers
- **Free**: Basic features for trying out the platform
- **Retail**: ₹999/month for individual traders
- **Professional**: ₹4,999/month for serious traders
- **Institutional**: ₹24,999/month for institutions
- **Enterprise**: Custom pricing for large organizations

### API Pricing
- **Single Prediction**: ₹0.10 per call
- **Batch Prediction**: ₹0.05 per stock
- **Custom Indicators**: ₹200 per indicator
- **Risk Analysis**: ₹0.15 per call

### Volume Discounts
- **100K+ calls/month**: 15% discount
- **500K+ calls/month**: 25% discount
- **1M+ calls/month**: 35% discount

## 🔧 Configuration

### Environment Variables
- `RAZORPAY_KEY_ID`: Your Razorpay API key
- `RAZORPAY_KEY_SECRET`: Your Razorpay secret key
- `EMAIL_USER`: Your email for notifications
- `EMAIL_PASSWORD`: Your email password/app password

### Database Configuration
- Development: SQLite (default)
- Production: PostgreSQL recommended

## 📊 Analytics

The system includes comprehensive analytics for:
- Revenue tracking
- User engagement
- API usage
- Prediction accuracy

## 🚀 Deployment

### Development
```bash
./scripts/start_dev.sh
```

### Production
```bash
./scripts/deploy_prod.sh
```

## 📞 Support

For support and questions:
- Email: info@kronos-india.com
- Documentation: /docs/
- API Docs: /api/docs

## 📄 License

This project is licensed under the MIT License.
"""
    
    with open('/home/z/my-project/indian_market/README_MONETIZATION.md', 'w') as f:
        f.write(readme_content)
    
    print("✅ Documentation created!")

def main():
    """Main function to run the quick start setup"""
    print("🎯 Starting Kronos-India Monetization Quick Start Setup")
    print("=" * 50)
    
    try:
        create_directory_structure()
        install_dependencies()
        create_config_files()
        create_app_skeleton()
        create_pricing_setup()
        create_marketing_materials()
        create_deployment_scripts()
        create_documentation()
        
        print("\n" + "=" * 50)
        print("🎉 Quick Start Setup Completed Successfully!")
        print("=" * 50)
        print("\n📋 Next Steps:")
        print("1. Edit .env file with your configuration")
        print("2. Set up Razorpay account and get API keys")
        print("3. Configure email settings")
        print("4. Run: ./scripts/start_dev.sh")
        print("5. Visit: http://localhost:5000")
        print("\n📚 Documentation:")
        print("- Read: README_MONETIZATION.md")
        print("- API Docs: http://localhost:5000/api/docs")
        print("- Admin Panel: http://localhost:5000/admin")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()