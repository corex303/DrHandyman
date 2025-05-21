import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ensure your Stripe secret key is set in your .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10', // Use the latest API version
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const { amount, invoiceNumber, email, currency = 'usd' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (typeof amount !== 'number') {
        return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 });
    }

    // Stripe expects the amount in the smallest currency unit (e.g., cents for USD)
    // If your frontend sends dollars, convert it to cents here.
    // For example, if amount is 10.00 (dollars), convert to 1000 (cents).
    const amountInCents = Math.round(amount * 100);

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        invoiceNumber: invoiceNumber || 'N/A',
      },
    };

    if (email) {
      paymentIntentParams.receipt_email = email;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error("Error creating PaymentIntent:", error);
    return NextResponse.json({ error: error.message || 'Failed to create PaymentIntent' }, { status: 500 });
  }
} 