export interface PaymentIntent {
  id: string;
  projectId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  description: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  createdAt: string;
  testMode: boolean;
}

export class PaymentService {
  private static intents: Map<string, PaymentIntent> = new Map();

  /**
   * Creates a payment session on the server
   */
  public static createPaymentIntent(params: {
    projectId: string;
    amount: number;
    currency?: string;
    customerEmail: string;
    description: string;
  }): {
    success: boolean;
    intent?: PaymentIntent;
    error?: string;
    isSimulation: boolean;
  } {
    const isStripeConfigured = Boolean(
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes('placeholder')
    );

    const intentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientSecret = `${intentId}_secret_${Math.random().toString(36).substring(2, 9)}`;

    const intent: PaymentIntent = {
      id: intentId,
      projectId: params.projectId,
      amount: params.amount,
      currency: (params.currency || 'USD').toUpperCase(),
      customerEmail: params.customerEmail,
      description: params.description,
      status: 'requires_payment_method',
      clientSecret,
      createdAt: new Date().toISOString(),
      testMode: true
    };

    this.intents.set(intentId, intent);

    return {
      success: true,
      intent,
      isSimulation: !isStripeConfigured
    };
  }

  /**
   * Verifies and marks a payment as succeeded (simulating server webhook or Stripe confirm)
   */
  public static verifyAndCapturePayment(intentId: string): {
    success: boolean;
    intent?: PaymentIntent;
    error?: string;
  } {
    const intent = this.intents.get(intentId);
    if (!intent) {
      return { success: false, error: 'Payment intent not found on server.' };
    }

    intent.status = 'succeeded';
    this.intents.set(intentId, intent);

    return {
      success: true,
      intent
    };
  }

  /**
   * Gets all payment records for a project
   */
  public static getIntentsForProject(projectId: string): PaymentIntent[] {
    const results: PaymentIntent[] = [];
    this.intents.forEach(intent => {
      if (intent.projectId === projectId) {
        results.push(intent);
      }
    });

    if (results.length === 0) {
      // Seed with initial realistic test payment
      const seeded: PaymentIntent = {
        id: `pi_test_seed_${projectId.slice(0, 5)}`,
        projectId,
        amount: 25.00,
        currency: 'USD',
        customerEmail: 'elena.rostova@example.com',
        description: 'Table Deposit - Aura Hearth',
        status: 'succeeded',
        clientSecret: 'pi_seed_secret',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        testMode: true
      };
      this.intents.set(seeded.id, seeded);
      return [seeded];
    }

    return results;
  }
}
