import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class TotpService {
  /**
   * Generates a cryptographically secure random Base32 secret (16-32 chars)
   */
  public static generateSecret(byteLength = 20): string {
    const bytes = crypto.randomBytes(byteLength);
    let bits = '';
    for (let i = 0; i < bytes.length; i++) {
      bits += bytes[i].toString(2).padStart(8, '0');
    }

    let base32 = '';
    for (let i = 0; i + 5 <= bits.length; i += 5) {
      const chunk = parseInt(bits.substr(i, 5), 2);
      base32 += BASE32_ALPHABET[chunk];
    }
    return base32;
  }

  /**
   * Decodes a Base32 string to Buffer
   */
  private static base32Decode(base32: string): Buffer {
    let bits = '';
    const clean = base32.replace(/[\s=-]/g, '').toUpperCase();
    for (let i = 0; i < clean.length; i++) {
      const val = BASE32_ALPHABET.indexOf(clean[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    return Buffer.from(bytes);
  }

  /**
   * Computes TOTP token for given secret and time offset
   */
  public static generateToken(secret: string, windowOffset = 0): string {
    const key = this.base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30; // Standard 30-second window
    const counter = Math.floor(epoch / timeStep) + windowOffset;

    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  /**
   * Verifies a 6-digit TOTP code against a Base32 secret.
   * Tolerates ±1 window (30s clock drift) for reliable scanning.
   */
  public static verifyToken(token: string, secret: string): boolean {
    const cleanToken = token.trim().replace(/\D/g, '');
    if (cleanToken.length !== 6) return false;

    // Check windows: current, -30s, +30s
    for (let offset = -1; offset <= 1; offset++) {
      const expected = this.generateToken(secret, offset);
      if (expected === cleanToken) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates the standard otpauth URI used by Microsoft Authenticator, Google Authenticator, etc.
   */
  public static getOtpAuthUrl(email: string, secret: string, issuer = 'DeployX'): string {
    const cleanEmail = email.trim();
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(`${issuer}:${cleanEmail}`);
    return `otpauth://totp/${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates high-resolution QR code URL for the otpauth URI
   */
  public static getQrCodeUrl(otpAuthUrl: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(otpAuthUrl)}`;
  }
}
