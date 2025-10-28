import { NextResponse } from 'next/server';

// This should be stored in environment variables in production
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        publishableKey: STRIPE_PUBLISHABLE_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment configuration',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}