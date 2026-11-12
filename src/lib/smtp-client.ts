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
  fromEmail?: string;
  subject: string;
  html: string;
}

export interface SmtpResult {
  success: boolean;
  error?: string;
}

/**
 * Pure Node.js zero-dependency TLS SMTP client for Gmail and standard SMTP servers.
 * Delivers transactional emails to ANY recipient without requiring custom domain DNS verification.
 * Handles multiline SMTP responses (RFC 5321) and buffer chunking reliably.
 */
export class SmtpClient {
  public static async sendMail(options: SmtpOptions, params: SendMailParams): Promise<SmtpResult> {
    const host = options.host || 'smtp.gmail.com';
    const port = options.port || 465;
    const { user, pass } = options;
    const { to, fromName = 'DeployX Security', fromEmail, subject, html } = params;

    const cleanUser = user.trim();
    const cleanPass = pass.replace(/\s+/g, ''); // Strip any spaces from Google App Password

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean, reason?: string) => {
        if (!settled) {
          settled = true;
          if (reason) console.log(`[SMTP Client] ${reason}`);
          try {
            socket.destroy();
          } catch {}
          resolve({ success: result, error: result ? undefined : (reason || 'Unknown SMTP error') });
        }
      };

      const socket = tls.connect(
        {
          host,
          port,
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
          timeout: 10000
        },
        () => {
          console.log(`[SMTP Client] TLS Connected to ${host}:${port}`);
        }
      );

      let step = 0;
      let buffer = '';

      const send = (str: string) => {
        socket.write(str + '\r\n');
      };

      socket.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // RFC 5321: Split buffer by CRLF to find completed lines
        const lines = buffer.split('\r\n');
        
        let completedCode: number | null = null;
        let completedMessage = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const match = line.match(/^(\d{3})([ -])(.*)$/);
          if (match) {
            const code = parseInt(match[1], 10);
            const isFinalLine = match[2] === ' ' || match[2] === '\t';
            
            // If server returned an error (4xx or 5xx) or reached the final line of a multiline reply
            if (code >= 400 || isFinalLine) {
              completedCode = code;
              completedMessage = buffer;
              buffer = lines.slice(i + 1).join('\r\n');
              break;
            }
          }
        }

        if (completedCode === null) {
          // Response still streaming (multiline like 250-), wait for next chunk
          return;
        }

        const code = completedCode;

        // Check for error responses (4xx or 5xx)
        if (code >= 400) {
          finish(false, `Server responded with error ${code}: ${completedMessage.trim()}`);
          return;
        }

        // State Machine
        switch (step) {
          case 0:
            // Expecting 220 Greeting from server
            if (code === 220) {
              step = 1;
              send('EHLO deployx.local');
            }
            break;

          case 1:
            // Expecting 250 from EHLO
            if (code === 250) {
              step = 2;
              send('AUTH LOGIN');
            }
            break;

          case 2:
            // Expecting 334 from AUTH LOGIN (Username challenge)
            if (code === 334) {
              step = 3;
              send(Buffer.from(cleanUser).toString('base64'));
            }
            break;

          case 3:
            // Expecting 334 (Password challenge)
            if (code === 334) {
              step = 4;
              send(Buffer.from(cleanPass).toString('base64'));
            }
            break;

          case 4:
            // Expecting 235 Authentication successful
            if (code === 235) {
              step = 5;
              send(`MAIL FROM:<${fromEmail || cleanUser}>`);
            }
            break;

          case 5:
            // Expecting 250 Sender OK
            if (code === 250) {
              step = 6;
              send(`RCPT TO:<${to.trim()}>`);
            }
            break;

          case 6:
            // Expecting 250 Recipient OK
            if (code === 250) {
              step = 7;
              send('DATA');
            }
            break;

          case 7:
            // Expecting 354 Start mail input
            if (code === 354) {
              step = 8;
              const emailPayload = [
                `From: "${fromName}" <${fromEmail || cleanUser}>`,
                `To: <${to.trim()}>`,
                `Subject: ${subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=UTF-8',
                '',
                html,
                '.'
              ].join('\r\n');
              send(emailPayload);
            }
            break;

          case 8:
            // Expecting 250 OK: message queued/delivered
            if (code === 250) {
              step = 9;
              send('QUIT');
              finish(true, `Email delivered successfully to ${to}`);
            }
            break;

          default:
            break;
        }
      });

      socket.on('error', (err) => {
        finish(false, `Socket TLS Error: ${err.message}`);
      });

      socket.on('timeout', () => {
        finish(false, 'Socket connection timed out');
      });

      socket.on('close', () => {
        finish(step >= 8, 'Socket closed');
      });
    });
  }
}
