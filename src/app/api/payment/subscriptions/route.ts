import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890', {
  apiVersion: '2024-12-18.acacia',
});

// Mock database for subscriptions
const mockSubscriptions = new Map<string, any>();

// Mock subscription plans
const subscriptionPlans = {
  basic: {
    id: 'price_basic',
    name: 'Basic',
    amount: 99900, // ₹999 in cents
    currency: 'inr',
    interval: 'month',
    features: ['Access to 3 AI Models', '100 Predictions Daily', 'Email Support', 'Basic Data Access'],
  },
  professional: {
    id: 'price_professional',
    name: 'Professional',
    amount: 499900, // ₹4,999 in cents
    currency: 'inr',
    interval: 'month',
    features: ['Access to 8 AI Models', 'Unlimited Predictions', 'Priority Support', 'Real-time Data', 'API Access', 'Advanced Analytics'],
  },
  institutional: {
    id: 'price_institutional',
    name: 'Institutional',
    amount: 2499900, // ₹24,999 in cents
    currency: 'inr',
    interval: 'month',
    features: ['All 12 AI Models', 'White-label Solution', 'Dedicated Support', 'Custom Integration', 'Advanced Analytics', 'On-premise Deployment'],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    const userId = request.headers.get('x-user-id') || 'default-user';

    if (subscriptionId) {
      // Get specific subscription
      const subscription = mockSubscriptions.get(subscriptionId);
      if (!subscription || subscription.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Subscription not found',
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: subscription,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get user's subscriptions
      const userSubscriptions = Array.from(mockSubscriptions.values()).filter(
        (sub) => sub.userId === userId
      );

      return NextResponse.json({
        success: true,
        data: userSubscriptions,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscriptions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, paymentMethodId, trialPeriodDays } = body;

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan ID',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id') || 'default-user';

    // Create Stripe subscription
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email: `${userId}@example.com`, // In production, get from user data
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscriptionData: any = {
      customer: customer.id,
      items: [{ price: plan.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    };

    if (trialPeriodDays) {
      subscriptionData.trial_period_days = trialPeriodDays;
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

    // Store subscription in mock database
    const subscription = {
      id: stripeSubscription.id,
      userId,
      planId: plan.id,
      planName: plan.name,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : undefined,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : undefined,
      paymentMethodId,
      features: plan.features,
      createdAt: new Date().toISOString(),
    };

    mockSubscriptions.set(stripeSubscription.id, subscription);

    return NextResponse.json({
      success: true,
      data: subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}