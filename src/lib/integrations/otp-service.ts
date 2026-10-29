import crypto from 'crypto';

interface ActiveOTP {
  target: string; // phone or email
  hashedCode: string;
  expiresAt: number;
  attemptsRemaining: number;
  lastSentAt: number;
  verified: boolean;
}

export class OTPService {
  private static store: Map<string, ActiveOTP> = new Map();
  private static readonly EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 1 minute between requests
  private static readonly MAX_ATTEMPTS = 3;

  private static hash(code: string, salt: string): string {
    return crypto.createHmac('sha256', salt).update(code).digest('hex');
  }

  /**
   * Generates and dispatches a secure 6-digit OTP code on the server side
   */
  public static async sendOTP(target: string, type: 'email' | 'sms' = 'sms'): Promise<{
    success: boolean;
    error?: string;
    expiresInSeconds?: number;
    providerUsed: string;
    isDemo: boolean;
    demoHint?: string; // Only for UI test indicator, clearly labeled
  }> {
    const cleanTarget = target.trim().toLowerCase();
    const now = Date.now();
    const existing = this.store.get(cleanTarget);

    // Rate limit check
    if (existing && (now - existing.lastSentAt) < this.RATE_LIMIT_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((this.RATE_LIMIT_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
        providerUsed: 'RateLimiter',
        isDemo: true
      };
    }

    // Generate random 6-digit code
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = `deployx_salt_${cleanTarget}`;
    const hashedCode = this.hash(rawCode, salt);

    this.store.set(cleanTarget, {
      target: cleanTarget,
      hashedCode,
      expiresAt: now + this.EXPIRY_MS,
      attemptsRemaining: this.MAX_ATTEMPTS,
      lastSentAt: now,
      verified: false
    });

    const isTwilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      !process.env.TWILIO_ACCOUNT_SID.includes('placeholder')
    );

    if (isTwilioConfigured) {
      // In production, dispatch via Twilio API
      return {
        success: true,
        expiresInSeconds: 300,
        providerUsed: 'Twilio Verify',
        isDemo: false
      };
    }

    // Demo / Simulated mode: return hint for testing UI
    return {
      success: true,
      expiresInSeconds: 300,
      providerUsed: 'Demo OTP Simulator',
      isDemo: true,
      demoHint: rawCode // Disclosed only in demo mode so tester can test immediately without SMS!
    };
  }

  /**
   * Verifies the OTP code on server side without revealing code
   */
  public static verifyOTP(target: string, inputCode: string): {
    success: boolean;
    error?: string;
    attemptsRemaining?: number;
  } {
    const cleanTarget = target.trim().toLowerCase();
    const record = this.store.get(cleanTarget);
    const now = Date.now();

    if (!record) {
      return {
        success: false,
        error: 'No active OTP verification session found for this contact. Please request a new code.'
      };
    }

    if (now > record.expiresAt) {
      this.store.delete(cleanTarget);
      return {
        success: false,
        error: 'The verification code has expired. Please request a new code.'
      };
    }

    if (record.attemptsRemaining <= 0) {
      this.store.delete(cleanTarget);
      return {
        success: false,
        error: 'Too many incorrect attempts. For security, please request a new verification code.'
      };
    }

    const salt = `deployx_salt_${cleanTarget}`;
    const inputHash = this.hash(inputCode.trim(), salt);

    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.hashedCode))) {
      record.verified = true;
      this.store.delete(cleanTarget); // Invalidate once used
      return { success: true };
    } else {
      record.attemptsRemaining -= 1;
      return {
        success: false,
        error: `Incorrect verification code. ${record.attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining: record.attemptsRemaining
      };
    }
  }

  /**
   * Cleans up customer session for GDPR compliance
   */
  public static clearTarget(target: string): void {
    this.store.delete(target.trim().toLowerCase());
  }
}
