import { NextRequest, NextResponse } from 'next/server';

// Mock database for UPI transactions (shared with initiate route)
const mockUpiTransactions = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const transactionId = params.transactionId;
    const transaction = mockUpiTransactions.get(transactionId);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Simulate payment verification (in production, check with actual UPI gateway)
    // For demo purposes, randomly mark some transactions as successful
    if (transaction.status === 'pending' && Math.random() > 0.7) {
      transaction.status = 'succeeded';
      transaction.completedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      data: {
        status: transaction.status,
        paymentIntent: transaction.status === 'succeeded' ? {
          id: `pi_${transactionId}`,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'succeeded',
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying UPI payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify UPI payment',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}