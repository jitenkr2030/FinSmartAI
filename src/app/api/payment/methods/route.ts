import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890', {
  apiVersion: '2024-12-18.acacia',
});

// Mock database for payment methods (in production, use a real database)
const mockPaymentMethods = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch payment methods from your database
    // associated with the authenticated user
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    // Mock data - replace with actual database query
    const paymentMethods = Array.from(mockPaymentMethods.values()).filter(
      (method) => method.userId === userId
    );

    return NextResponse.json({
      success: true,
      data: paymentMethods,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment methods',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stripePaymentMethodId, type, isDefault, card, upi, bankAccount, wallet } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method type is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id') || 'default-user';
    
    let paymentMethodData: any = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
    };

    // Handle different payment method types
    switch (type) {
      case 'card':
        if (!stripePaymentMethodId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Stripe payment method ID is required for card payments',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        
        // Retrieve payment method details from Stripe
        const stripePaymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
        
        paymentMethodData = {
          ...paymentMethodData,
          stripePaymentMethodId,
          brand: stripePaymentMethod.card?.brand,
          last4: stripePaymentMethod.card?.last4,
          expiryMonth: stripePaymentMethod.card?.exp_month,
          expiryYear: stripePaymentMethod.card?.exp_year,
        };
        break;

      case 'upi':
        if (!upi?.upiId) {
          return NextResponse.json(
            {
              success: false,
              error: 'UPI ID is required for UPI payments',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        paymentMethodData.upiId = upi.upiId;
        break;

      case 'bank_account':
        if (!bankAccount?.accountNumber || !bankAccount?.ifsc) {
          return NextResponse.json(
            {
              success: false,
              error: 'Account number and IFSC are required for bank account payments',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        paymentMethodData.bankName = bankAccount.bankName || 'Unknown Bank';
        paymentMethodData.accountNumber = `****${bankAccount.accountNumber.slice(-4)}`;
        break;

      case 'wallet':
        if (!wallet?.type || !wallet?.phoneNumber) {
          return NextResponse.json(
            {
              success: false,
              error: 'Wallet type and phone number are required for wallet payments',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        paymentMethodData.walletType = wallet.type;
        paymentMethodData.phoneNumber = wallet.phoneNumber;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported payment method type',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }

    // If this is set as default, unset other default payment methods
    if (paymentMethodData.isDefault) {
      Array.from(mockPaymentMethods.values()).forEach((method) => {
        if (method.userId === userId && method.isDefault) {
          method.isDefault = false;
        }
      });
    }

    // Store payment method (in production, save to database)
    mockPaymentMethods.set(paymentMethodData.id, paymentMethodData);

    return NextResponse.json({
      success: true,
      data: paymentMethodData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment method',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}