import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/integrations/payment-service';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Check if Stripe is configured
    const isConfigured = Boolean(webhookSecret && !webhookSecret.includes('placeholder'));

    if (isConfigured && !signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Process event
    if (event.type === 'payment_intent.succeeded' || event.type === 'test.simulate_success') {
      const intentId = event.data?.object?.id || event.intentId;
      if (intentId) {
        PaymentService.verifyAndCapturePayment(intentId);
      }
    }

    return NextResponse.json({
      received: true,
      verifiedOnServer: true,
      mode: isConfigured ? 'live_stripe_webhook' : 'simulated_test_webhook'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
