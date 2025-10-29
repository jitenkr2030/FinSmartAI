import { NextRequest, NextResponse } from 'next/server';

// Mock database for wallet transactions
const mockWalletTransactions = new Map<string, any>();

// Supported wallet providers
const walletProviders = {
  paytm: {
    name: 'Paytm',
    redirectUrl: 'https://paytm.com/checkout/payment',
  },
  phonepe: {
    name: 'PhonePe',
    redirectUrl: 'https://phonepe.com/transaction/pay',
  },
  gpay: {
    name: 'Google Pay',
    redirectUrl: 'https://pay.google.com/payments/v1/',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletType, phoneNumber, amount, description } = body;

    // Validate required fields
    if (!walletType || !phoneNumber || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet type, phone number, and valid amount are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate wallet type
    if (!walletProviders[walletType as keyof typeof walletProviders]) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported wallet type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate phone number (basic validation for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id') || 'default-user';
    const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const provider = walletProviders[walletType as keyof typeof walletProviders];

    // Create wallet transaction (in production, integrate with actual wallet payment gateway)
    const transaction = {
      id: transactionId,
      userId,
      walletType,
      phoneNumber,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'inr',
      description: description || 'Wallet Payment',
      status: 'pending',
      redirectUrl: `${provider.redirectUrl}?txnId=${transactionId}&amount=${amount}&phone=${phoneNumber}`,
      createdAt: new Date().toISOString(),
    };

    mockWalletTransactions.set(transactionId, transaction);

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        redirectUrl: transaction.redirectUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initiating wallet payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate wallet payment',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}