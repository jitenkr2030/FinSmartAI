import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { paymentMethodId } = body;
    const paymentIntentId = params.id;

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Confirm the payment intent
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: confirmedPaymentIntent.id,
        amount: confirmedPaymentIntent.amount,
        currency: confirmedPaymentIntent.currency,
        status: confirmedPaymentIntent.status,
        clientSecret: confirmedPaymentIntent.client_secret,
        paymentMethodId: confirmedPaymentIntent.payment_method,
        description: confirmedPaymentIntent.description,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment intent',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}