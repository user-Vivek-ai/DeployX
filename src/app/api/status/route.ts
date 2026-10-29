import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/adapter';
import { SystemHealthStatus } from '@/lib/types';

export async function GET() {
  const aiStatus = AIProviderFactory.getActiveProviderStatus();

  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('placeholder')
  );

  const otpConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    !process.env.TWILIO_ACCOUNT_SID.includes('placeholder')
  );

  const response: SystemHealthStatus = {
    status: 'healthy',
    ai: {
      activeProvider: aiStatus.providerName,
      isMock: aiStatus.isSimulated,
      availableProviders: aiStatus.available.map(p => ({
        name: p.name,
        keyConfigured: p.configured
      }))
    },
    integrations: {
      stripeTestMode: true,
      stripeConfigured,
      otpProvider: process.env.OTP_PROVIDER || 'demo',
      otpConfigured,
      deploymentProvider: process.env.DEPLOYMENT_PROVIDER || 'local'
    },
    serverTime: new Date().toISOString()
  };

  return NextResponse.json(response);
}
