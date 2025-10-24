import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890', {
  apiVersion: '2024-12-18.acacia',
});

// Mock database for payment intents
const mockPaymentIntents = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'inr', paymentMethodId, description } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid amount is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: paymentMethodId ? 'automatic' : 'manual',
      description,
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    // Store payment intent in mock database
    const paymentIntentData = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      paymentMethodId: paymentIntent.payment_method,
      description: paymentIntent.description,
      createdAt: new Date().toISOString(),
    };

    mockPaymentIntents.set(paymentIntent.id, paymentIntentData);

    return NextResponse.json({
      success: true,
      data: paymentIntentData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = request.headers.get('x-user-id') || 'default-user';

    // In a real application, you would fetch payment intents from your database
    // associated with the authenticated user
    const paymentIntents = Array.from(mockPaymentIntents.values())
      .slice(-limit)
      .reverse();

    return NextResponse.json({
      success: true,
      data: paymentIntents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching payment intents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment intents',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}