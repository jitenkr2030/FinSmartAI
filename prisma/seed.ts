import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finsmartai.com' },
    update: {},
    create: {
      email: 'demo@finsmartai.com',
      passwordHash: hashedPassword,
      fullName: 'Demo User',
      phone: '+91-9876543210',
      emailVerified: true,
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@finsmartai.com' },
    update: {},
    create: {
      email: 'admin@finsmartai.com',
      passwordHash: hashedPassword,
      fullName: 'Admin User',
      phone: '+91-9876543211',
      emailVerified: true,
      isActive: true,
    },
  });

  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      description: 'Individual Traders',
      price: 999,
      durationDays: 30,
      features: JSON.stringify([
        'Access to 3 AI Models',
        '100 Predictions Daily',
        'Email Support',
        'Basic Data Access',
        'Mobile App Access'
      ]),
      isActive: true,
    },
  });

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
      name: 'Professional',
      description: 'Professional Traders',
      price: 4999,
      durationDays: 30,
      features: JSON.stringify([
        'Access to 8 AI Models',
        'Unlimited Predictions',
        'Priority Support',
        'Real-time Data',
        'API Access',
        'Advanced Analytics'
      ]),
      isActive: true,
    },
  });

  const institutionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Institutional' },
    update: {},
    create: {
      name: 'Institutional',
      description: 'Financial Institutions',
      price: 24999,
      durationDays: 30,
      features: JSON.stringify([
        'All 12 AI Models',
        'White-label Solution',
        'Dedicated Support',
        'Custom Integration',
        'Advanced Analytics',
        'On-premise Deployment'
      ]),
      isActive: true,
    },
  });

  // Create user subscriptions
  await prisma.userSubscription.upsert({
    where: { 
      userId_planId: {
        userId: demoUser.id,
        planId: professionalPlan.id
      }
    },
    update: {},
    create: {
      userId: demoUser.id,
      planId: professionalPlan.id,
      status: 'active',
      startedAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create AI Models
  const aiModels = [
    {
      name: 'Kronos-SentimentAI',
      description: 'News/Social Media Sentiment Analysis',
      version: '1.0.0',
      modelType: 'sentiment',
      architecture: JSON.stringify({
        type: 'transformer',
        layers: 12,
        heads: 8,
        dimensions: 768
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'financial_news_social_media',
        size: '10M+ samples',
        languages: ['en', 'hi'],
        timeRange: '2020-2024'
      }),
      performanceMetrics: JSON.stringify({
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91
      })
    },
    {
      name: 'Kronos-OptionsAI',
      description: 'Options Price Prediction & Analysis',
      version: '1.0.0',
      modelType: 'options',
      architecture: JSON.stringify({
        type: 'hybrid',
        models: ['black-scholes', 'monte-carlo', 'neural-network']
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'options_chain_data',
        size: '5M+ samples',
        instruments: ['NIFTY', 'BANKNIFTY', 'STOCKS'],
        timeRange: '2019-2024'
      }),
      performanceMetrics: JSON.stringify({
        pricingAccuracy: 0.95,
        greeksAccuracy: 0.93,
        predictionAccuracy: 0.88
      })
    },
    {
      name: 'Kronos-RiskAI',
      description: 'Portfolio Risk Analysis',
      version: '1.0.0',
      modelType: 'risk',
      architecture: JSON.stringify({
        type: 'ensemble',
        models: ['var', 'cvar', 'monte-carlo', 'stress-testing']
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'portfolio_data',
        size: '2M+ samples',
        assetClasses: ['equity', 'debt', 'commodities', 'fx'],
        timeRange: '2018-2024'
      }),
      performanceMetrics: JSON.stringify({
        varAccuracy: 0.94,
        riskPrediction: 0.91,
        portfolioOptimization: 0.87
      })
    },
    {
      name: 'Kronos-FundFlowAI',
      description: 'FII/DII Fund Flow Prediction',
      version: '1.0.0',
      modelType: 'fundflow',
      architecture: JSON.stringify({
        type: 'lstm',
        layers: 4,
        units: 256,
        dropout: 0.2
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'institutional_flows',
        size: '1M+ samples',
        segments: ['cash', 'derivatives', 'debt'],
        timeRange: '2019-2024'
      }),
      performanceMetrics: JSON.stringify({
        flowPrediction: 0.89,
        trendAccuracy: 0.86,
        sentimentCorrelation: 0.92
      })
    },
    {
      name: 'Kronos-NewsInsightAI',
      description: 'AI News Summary & Analysis',
      version: '1.0.0',
      modelType: 'nlp',
      architecture: JSON.stringify({
        type: 'transformer',
        model: 'bert-based',
        fineTuned: true
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'financial_news',
        size: '8M+ samples',
        sources: ['reuters', 'bloomberg', 'economic-times', 'livemint'],
        timeRange: '2020-2024'
      }),
      performanceMetrics: JSON.stringify({
        summarization: 0.93,
        sentimentAccuracy: 0.91,
        entityRecognition: 0.89
      })
    },
    {
      name: 'Kronos-AlphaAI',
      description: 'Automated Trading Strategy Generation',
      version: '1.0.0',
      modelType: 'trading',
      architecture: JSON.stringify({
        type: 'reinforcement-learning',
        algorithm: 'PPO',
        neuralNetwork: 'deep-q-network'
      }),
      trainingDataInfo: JSON.stringify({
        dataset: 'market_data',
        size: '15M+ samples',
        instruments: ['NIFTY50', 'BANKNIFTY', 'TOP_100_STOCKS'],
        timeRange: '2018-2024'
      }),
      performanceMetrics: JSON.stringify({
        strategyGeneration: 0.88,
        backtestingAccuracy: 0.85,
        riskAdjustedReturns: 0.82
      })
    }
  ];

  for (const modelData of aiModels) {
    await prisma.aIModel.upsert({
      where: { name: modelData.name },
      update: {},
      create: modelData,
    });
  }

  // Create sample financial instruments
  const instruments = [
    { symbol: 'NIFTY', name: 'Nifty 50', type: 'index', exchange: 'NSE', currency: 'INR' },
    { symbol: 'BANKNIFTY', name: 'Nifty Bank', type: 'index', exchange: 'NSE', currency: 'INR' },
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', type: 'stock', exchange: 'NSE', currency: 'INR' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', type: 'stock', exchange: 'NSE', currency: 'INR' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'stock', exchange: 'NSE', currency: 'INR' },
    { symbol: 'INFY', name: 'Infosys Ltd', type: 'stock', exchange: 'NSE', currency: 'INR' },
    { symbol: 'SBIN', name: 'State Bank of India', type: 'stock', exchange: 'NSE', currency: 'INR' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', type: 'stock', exchange: 'NSE', currency: 'INR' },
  ];

  for (const instrument of instruments) {
    await prisma.financialInstrument.upsert({
      where: { symbol: instrument.symbol },
      update: {},
      create: instrument,
    });
  }

  // Create sample portfolio for demo user
  const demoPortfolio = await prisma.portfolio.create({
    data: {
      userId: demoUser.id,
      name: 'Demo Portfolio',
      description: 'Sample portfolio for demonstration',
      isActive: true,
    },
  });

  // Add some holdings to the demo portfolio
  const holdings = [
    { symbol: 'RELIANCE', quantity: 10, avgPrice: 2500 },
    { symbol: 'TCS', quantity: 5, avgPrice: 3500 },
    { symbol: 'HDFCBANK', quantity: 20, avgPrice: 1500 },
    { symbol: 'INFY', quantity: 15, avgPrice: 1400 },
  ];

  for (const holding of holdings) {
    const instrument = await prisma.financialInstrument.findUnique({
      where: { symbol: holding.symbol },
    });

    if (instrument) {
      await prisma.portfolioHolding.create({
        data: {
          portfolioId: demoPortfolio.id,
          instrumentId: instrument.id,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
        },
      });
    }
  }

  // Create sample news articles
  const newsArticles = [
    {
      title: 'Nifty 50 closes at record high on positive global cues',
      content: 'The Nifty 50 index closed at a record high today, driven by positive global market sentiment and strong foreign institutional investor inflows.',
      source: 'Economic Times',
      url: 'https://economictimes.indiatimes.com/nifty-record-high',
      sentiment: 0.8,
      relevance: 0.9,
    },
    {
      title: 'RBI keeps interest rates unchanged, maintains accommodative stance',
      content: 'The Reserve Bank of India has decided to keep the key interest rates unchanged in its latest monetary policy meeting, maintaining an accommodative stance to support economic growth.',
      source: 'Mint',
      url: 'https://www.livemint.com/rbi-policy',
      sentiment: 0.2,
      relevance: 0.95,
    },
    {
      title: 'Tech stocks lead market gains as IT sector shows strong growth',
      content: 'Information technology stocks led the market gains today as the sector showed strong growth prospects amid increasing demand for digital transformation services.',
      source: 'Business Standard',
      url: 'https://www.business-standard.com/tech-stocks',
      sentiment: 0.7,
      relevance: 0.85,
    },
  ];

  for (const article of newsArticles) {
    await prisma.newsArticle.create({
      data: {
        ...article,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within last week
      },
    });
  }

  // Create sample institutional flow data
  const flows = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    flows.push({
      date,
      fiiBuy: Math.random() * 2000 + 500,
      fiiSell: Math.random() * 1500 + 300,
      diiBuy: Math.random() * 1500 + 300,
      diiSell: Math.random() * 1000 + 200,
      segment: 'cash',
    });
  }

  for (const flow of flows) {
    await prisma.institutionalFlow.create({
      data: {
        ...flow,
        fiiNet: flow.fiiBuy - flow.fiiSell,
        diiNet: flow.diiBuy - flow.diiSell,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.subscriptionPlan.count()} subscription plans`);
  console.log(`   - ${await prisma.aIModel.count()} AI models`);
  console.log(`   - ${await prisma.financialInstrument.count()} financial instruments`);
  console.log(`   - ${await prisma.portfolio.count()} portfolios`);
  console.log(`   - ${await prisma.newsArticle.count()} news articles`);
  console.log(`   - ${await prisma.institutionalFlow.count()} institutional flow records`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });