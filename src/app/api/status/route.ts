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

  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  const response = {
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
      deploymentProvider: process.env.DEPLOYMENT_PROVIDER || 'local',
      email: {
        smtpUserConfigured: Boolean(smtpUser),
        smtpUserValidFormat: Boolean(smtpUser && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser.trim())),
        smtpUserValue: smtpUser ? (smtpUser.includes('@') ? `${smtpUser.slice(0, 3)}***@${smtpUser.split('@')[1]}` : `INVALID_NOT_EMAIL("${smtpUser.slice(0, 4)}***")`) : null,
        smtpPassConfigured: Boolean(smtpPass),
        smtpPassLength: smtpPass ? smtpPass.replace(/\s+/g, '').length : 0,
        resendConfigured: Boolean(resendKey && !resendKey.includes('placeholder')),
        fromEmailConfigured: Boolean(process.env.FROM_EMAIL || process.env.EMAIL_FROM),
        fromEmailValue: process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev (Sandbox - delivers only to account owner)',
        activeEngine: (smtpUser && smtpPass && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser.trim())) ? 'Gmail SMTP' : (resendKey ? 'Resend API' : 'None')
      }
    },
    serverTime: new Date().toISOString()
  };

  return NextResponse.json(response);
}
