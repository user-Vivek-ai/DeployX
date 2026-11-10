import tls from 'tls';

export interface SmtpOptions {
  user: string;
  pass: string;
  host?: string;
  port?: number;
}

export interface SendMailParams {
  to: string;
  fromName?: string;
  subject: string;
  html: string;
}

/**
 * Pure Node.js zero-dependency TLS SMTP client for Gmail and standard SMTP servers.
 * Delivers transactional emails to ANY recipient without requiring custom domain DNS verification.
 */
export class SmtpClient {
  public static async sendMail(options: SmtpOptions, params: SendMailParams): Promise<boolean> {
    const host = options.host || 'smtp.gmail.com';
    const port = options.port || 465;
    const { user, pass } = options;
    const { to, fromName = 'DeployX Security', subject, html } = params;

    return new Promise((resolve) => {
      const socket = tls.connect({ host, port, minVersion: 'TLSv1.2', timeout: 8000 }, () => {
        let step = 0;

        const send = (str: string) => {
          socket.write(str + '\r\n');
        };

        socket.on('data', (data) => {
          const response = data.toString();

          if (step === 0 && response.startsWith('220')) {
            step = 1;
            send('EHLO deployx.local');
          } else if (step === 1 && response.startsWith('250')) {
            step = 2;
            send('AUTH LOGIN');
          } else if (step === 2 && response.startsWith('334')) {
            step = 3;
            send(Buffer.from(user).toString('base64'));
          } else if (step === 3 && response.startsWith('334')) {
            step = 4;
            send(Buffer.from(pass.replace(/\s+/g, '')).toString('base64'));
          } else if (step === 4 && response.startsWith('235')) {
            step = 5;
            send(`MAIL FROM:<${user}>`);
          } else if (step === 5 && response.startsWith('250')) {
            step = 6;
            send(`RCPT TO:<${to}>`);
          } else if (step === 6 && response.startsWith('250')) {
            step = 7;
            send('DATA');
          } else if (step === 7 && response.startsWith('354')) {
            step = 8;
            const emailBody = [
              `From: "${fromName}" <${user}>`,
              `To: <${to}>`,
              `Subject: ${subject}`,
              'MIME-Version: 1.0',
              'Content-Type: text/html; charset=UTF-8',
              '',
              html,
              '.'
            ].join('\r\n');
            send(emailBody);
          } else if (step === 8 && response.startsWith('250')) {
            step = 9;
            send('QUIT');
            socket.end();
            resolve(true);
          } else if (response.startsWith('5') || response.startsWith('4')) {
            console.warn(`SMTP error at step ${step}:`, response.trim());
            socket.destroy();
            resolve(false);
          }
        });
      });

      socket.on('error', (err) => {
        console.warn('SMTP socket error:', err.message);
        resolve(false);
      });

      socket.on('timeout', () => {
        console.warn('SMTP connection timed out');
        socket.destroy();
        resolve(false);
      });
    });
  }
}
