/**
 * DeployX Email Dispatch Service
 * Dispatches real 6-digit OTP codes to the user's email inbox using:
 * 1. Resend API (RESEND_API_KEY)
 * 2. Brevo API (BREVO_API_KEY)
 * 3. SendGrid API (SENDGRID_API_KEY)
 * 4. SMTP / Gmail App Password (EMAIL_USER & EMAIL_PASS or SMTP_USER & SMTP_PASS)
 */

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
                Verify your email address
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                Please use the following 6-digit one-time password (OTP) to complete your DeployX account registration:
              </p>
            </td>
          </tr>

          <!-- Big OTP Code Box -->
          <tr>
            <td align="center" style="padding: 16px 0 24px 0;">
              <div style="background-color: #0d0d10; border: 1px solid #6366f1; border-radius: 16px; padding: 20px; letter-spacing: 12px; font-size: 32px; font-weight: 800; font-family: 'Courier New', Courier, monospace; color: #818cf8; text-align: center;">
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
              If you didn't attempt to sign up for DeployX, you can safely disregard this email. Your email address remains secure.
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
   * Main dispatch method trying configured services in priority order:
   * 1. Resend API
   * 2. Brevo API
   * 3. SendGrid API
   * 4. Gmail / Nodemailer SMTP
   */
  public static async sendVerificationOTP(params: SendEmailParams): Promise<EmailDispatchResult> {
    const { toEmail, toName, otpCode } = params;
    const html = this.getEmailHtml(toName, otpCode);
    const subject = `Your DeployX Verification Code: ${otpCode}`;

    // 1. Try Resend API (Most reliable for Next.js / Vercel)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && !resendKey.includes('placeholder')) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'DeployX <onboarding@resend.dev>';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            html
          })
        });

        if (res.ok) {
          return { success: true, provider: 'Resend', serviceConfigured: true };
        } else {
          const errText = await res.text();
          console.warn('Resend dispatch error:', errText);
        }
      } catch (err: any) {
        console.warn('Resend fetch failed:', err.message);
      }
    }

    // 2. Try Brevo (Sendinblue) API
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
            sender: { name: 'DeployX', email: process.env.EMAIL_FROM || 'auth@deployx.dev' },
            to: [{ email: toEmail, name: toName }],
            subject,
            htmlContent: html
          })
        });

        if (res.ok) {
          return { success: true, provider: 'Brevo', serviceConfigured: true };
        }
      } catch (err: any) {
        console.warn('Brevo dispatch error:', err.message);
      }
    }

    // 3. Try SendGrid API
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey && !sendgridKey.includes('placeholder')) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: toEmail, name: toName }] }],
            from: { email: process.env.EMAIL_FROM || 'auth@deployx.dev', name: 'DeployX' },
            subject,
            content: [{ type: 'text/html', value: html }]
          })
        });

        if (res.ok || res.status === 202) {
          return { success: true, provider: 'SendGrid', serviceConfigured: true };
        }
      } catch (err: any) {
        console.warn('SendGrid dispatch error:', err.message);
      }
    }

    // 4. Try Gmail / SMTP via Nodemailer if credentials exist
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (emailUser && emailPass) {
      try {
        // Dynamically import nodemailer to avoid build failures if not yet installed
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });

        await transporter.sendMail({
          from: `"DeployX Security" <${emailUser}>`,
          to: toEmail,
          subject,
          html
        });

        return { success: true, provider: 'Gmail SMTP', serviceConfigured: true };
      } catch (err: any) {
        console.warn('Nodemailer SMTP dispatch failed:', err.message);
      }
    }

    // No external email provider is currently configured in environment variables
    return {
      success: false,
      error: 'No transactional email provider configured yet.',
      serviceConfigured: false
    };
  }
}
