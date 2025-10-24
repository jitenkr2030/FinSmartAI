import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OptimizedQueries, QueryOptimizer } from '@/lib/utils/queryOptimization';

// GET /api/portfolio - List user portfolios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Use optimized query with caching and pagination
    const result = await OptimizedQueries.getUserPortfolios(userId, page, limit);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Create new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, holdings = [] } = body;
    
    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and portfolio name are required' },
        { status: 400 }
      );
    }
    
    // Use optimized user query with cache invalidation
    const user = await OptimizedQueries.getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create portfolio with transaction for data consistency
    const portfolio = await QueryOptimizer.monitorQuery('createPortfolio', async () => {
      return await db.$transaction(async (tx) => {
        // Create portfolio
        const newPortfolio = await tx.portfolio.create({
          data: {
            userId,
            name,
            description: description || null,
            isActive: true
          }
        });
        
        // Add holdings if provided using optimized bulk operation
        if (holdings.length > 0) {
          const holdingPromises = holdings.map(async (holding: any) => {
            // Find or create instrument
            let instrument = await tx.financialInstrument.findUnique({
              where: { symbol: holding.symbol }
            });
            
            if (!instrument) {
              instrument = await tx.financialInstrument.create({
                data: {
                  symbol: holding.symbol,
                  name: holding.name || holding.symbol,
                  type: holding.type || 'stock',
                  exchange: holding.exchange || 'NSE',
                  currency: holding.currency || 'INR'
                }
              });
            }
            
            // Create holding
            return tx.portfolioHolding.create({
              data: {
                portfolioId: newPortfolio.id,
                instrumentId: instrument.id,
                quantity: holding.quantity,
                avgPrice: holding.avgPrice
              }
            });
          });
          
          await Promise.all(holdingPromises);
        }
        
        return newPortfolio;
      });
    });
    
    // Invalidate user cache after creating portfolio
    await QueryOptimizer.invalidateUserRelatedCache(userId);
    
    // Fetch the complete portfolio with holdings using optimized query
    const completePortfolio = await db.portfolio.findUnique({
      where: { id: portfolio.id },
      include: {
        holdings: {
          include: {
            instrument: {
              select: {
                id: true,
                symbol: true,
                name: true,
                type: true,
                exchange: true,
                currency: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: completePortfolio
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}