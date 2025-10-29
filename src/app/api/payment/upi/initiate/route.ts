import { NextRequest, NextResponse } from 'next/server';

// Mock database for UPI transactions
const mockUpiTransactions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { upiId, amount, description } = body;

    // Validate required fields
    if (!upiId || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'UPI ID and valid amount are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/;
    if (!upiRegex.test(upiId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid UPI ID format',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id') || 'default-user';
    const transactionId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create UPI transaction (in production, integrate with actual UPI payment gateway)
    const transaction = {
      id: transactionId,
      userId,
      upiId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'inr',
      description: description || 'UPI Payment',
      status: 'pending',
      upiUrl: `upi://pay?pa=${upiId}&pn=FinSmartAI&am=${amount}&cu=INR&tn=${encodeURIComponent(description || 'Payment')}`,
      createdAt: new Date().toISOString(),
    };

    mockUpiTransactions.set(transactionId, transaction);

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        upiUrl: transaction.upiUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initiating UPI payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate UPI payment',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}