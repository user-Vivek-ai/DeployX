import { SmtpClient } from './smtp-client';

interface SendEmailParams {
  toEmail: string;
  toName: string;
  otpCode: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: string;
  error?: string;
  serviceConfigured: boolean;
}

export class EmailService {
  /**
   * Generates a modern branded HTML email template for the OTP code.
   */
  private static getEmailHtml(name: string, otp: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeployX Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f0f11; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1a1a1f; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); text-align: center; font-weight: 800; font-size: 18px; color: #ffffff;">
                Dx
              </div>
              <h2 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                DeployX
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">
                Autonomous Software Engineering & Web Deployment
              </p>
            </td>
          </tr>

          <!-- Greeting & Description -->
          <tr>
            <td style="padding-bottom: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                Email Verification Code
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                Please use the following 6-digit verification code to complete your DeployX account registration:
              </p>
            </td>
          </tr>

          <!-- Big OTP Code Box -->
          <tr>
            <td align="center" style="padding: 16px 0 24px 0;">
              <div style="background-color: #0d0d10; border: 1px solid #6366f1; border-radius: 16px; padding: 20px; letter-spacing: 12px; font-size: 34px; font-weight: 800; font-family: 'Courier New', Courier, monospace; color: #818cf8; text-align: center;">
                ${otp}
              </div>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #ef4444; font-weight: 500;">
                ⏱ Valid for 5 minutes. Do not share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; line-height: 1.5; color: #6b7280;">
              If you did not request this verification code, please ignore this email. No changes will be made to your account.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; font-size: 11px; color: #4b5563;">
              &copy; 2026 DeployX Inc. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Main dispatch method trying configured services:
   * 1. Direct Gmail SMTP via TLS (delivers to ANY recipient without domain verification)
   * 2. Resend API (delivers to any recipient if custom domain is verified; or account owner if on sandbox)
   * 3. Brevo API
   */
  public static async sendVerificationOTP(params: SendEmailParams): Promise<EmailDispatchResult> {
    const { toEmail, toName, otpCode } = params;
    const cleanTo = toEmail.trim().toLowerCase();
    const html = this.getEmailHtml(toName, otpCode);
    const subject = `Your DeployX Verification Code: ${otpCode}`;

    let lastError = '';

    // 1. Try Direct Gmail / SMTP via Pure Node.js TLS (Sends to ANY recipient without custom domain requirements)
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;

    // Validate if EMAIL_USER is a valid email string
    const isValidEmail = (str?: string) => Boolean(str && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim()));

    if (smtpUser && smtpPass) {
      if (!isValidEmail(smtpUser)) {
        const warn = `EMAIL_USER must be a full email address (e.g. yourname@gmail.com). Current value: "${smtpUser}".`;
        console.warn(`[DeployX Email] ${warn}`);
        lastError = warn;
      } else {
        try {
          const smtpResult = await SmtpClient.sendMail(
            { user: smtpUser, pass: smtpPass, host: smtpHost, port: smtpPort },
            { to: cleanTo, fromName: 'DeployX Verification', subject, html }
          );
          if (smtpResult.success) {
            return { success: true, provider: 'Gmail SMTP', serviceConfigured: true };
          } else {
            lastError = `Gmail SMTP error: ${smtpResult.error}`;
            console.warn('[DeployX Email] Gmail SMTP failed:', smtpResult.error);
          }
        } catch (err: any) {
          lastError = `SMTP error: ${err.message}`;
          console.warn('[DeployX Email] SMTP dispatch exception:', err.message);
        }
      }
    }

    // 2. Try Resend API
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && !resendKey.includes('placeholder')) {
      try {
        const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'DeployX <onboarding@resend.dev>';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [cleanTo],
            subject,
            html
          })
        });

        if (res.ok) {
          return { success: true, provider: 'Resend', serviceConfigured: true };
        } else {
          const errText = await res.text();
          let parsedMsg = errText;
          try {
            const parsed = JSON.parse(errText);
            parsedMsg = parsed.message || errText;
          } catch {}
          lastError = `Resend Notice: ${parsedMsg}`;
          console.warn('[DeployX Email] Resend dispatch error:', errText);
        }
      } catch (err: any) {
        lastError = `Resend connection failed: ${err.message}`;
      }
    }

    // 3. Try Brevo (Sendinblue) API
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoKey && !brevoKey.includes('placeholder')) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'DeployX', email: process.env.FROM_EMAIL || 'auth@deployx.dev' },
            to: [{ email: cleanTo, name: toName }],
            subject,
            htmlContent: html
          })
        });

        if (res.ok) {
          return { success: true, provider: 'Brevo', serviceConfigured: true };
        }
      } catch (err: any) {
        lastError = `Brevo error: ${err.message}`;
      }
    }

    return {
      success: false,
      error: lastError || 'No transactional email provider configured yet.',
      serviceConfigured: Boolean((smtpUser && smtpPass) || resendKey || brevoKey)
    };
  }
}
