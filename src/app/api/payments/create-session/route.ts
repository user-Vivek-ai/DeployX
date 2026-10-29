import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/integrations/payment-service';

export async function POST(req: Request) {
  try {
    const { projectId, amount, currency, customerEmail, description } = await req.json();

    if (!projectId || !amount || !customerEmail) {
      return NextResponse.json({
        error: 'Missing required parameters: projectId, amount, customerEmail'
      }, { status: 400 });
    }

    const result = PaymentService.createPaymentIntent({
      projectId,
      amount: Number(amount),
      currency,
      customerEmail,
      description: description || 'DeployX Platform Transaction'
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      intent: result.intent,
      isSimulation: result.isSimulation,
      message: result.isSimulation
        ? 'Created test payment session (Stripe Simulation Mode)'
        : 'Created Stripe Payment Intent'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment intent creation failed' }, { status: 500 });
  }
}
