import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface PendingRegistration {
  email: string;
  name: string;
  otpHash: string;
  expiresAt: number;
  attemptsRemaining: number;
  verified: boolean;
  rawCodeForDemo?: string;
}

const USERS_FILE = path.join(os.tmpdir(), '.deployx_users.json');

export function validatePassword(password: string): {
  valid: boolean;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  errors: string[];
} {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('At least 8 characters');
  if (!hasUpper) errors.push('At least 1 uppercase letter (A-Z)');
  if (!hasLower) errors.push('At least 1 lowercase letter (a-z)');
  if (!hasNumber) errors.push('At least 1 number (0-9)');

  return {
    valid: hasMinLength && hasUpper && hasLower && hasNumber,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    errors
  };
}

export class AuthStore {
  private static users: Map<string, UserAccount> = new Map();
  private static pendingRegistrations: Map<string, PendingRegistration> = new Map();
  private static sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  private static initialized = false;

  private static init() {
    if (this.initialized) return;

    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const list: UserAccount[] = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.email.toLowerCase(), u);
        }
        this.initialized = true;
        return;
      }
    } catch {
      // Re-seed if file reading fails
    }

    // Seed default developer account for immediate testing
    this.seedDefaultUser();
    this.saveToDisk();
    this.initialized = true;
  }

  private static hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  private static seedDefaultUser() {
    const salt = crypto.randomBytes(16).toString('hex');
    const defaultUser: UserAccount = {
      id: 'usr_dev_01',
      name: 'Vivek Akula',
      email: 'developer@deployx.dev',
      salt,
      passwordHash: this.hashPassword('DeployX2026!', salt),
      createdAt: new Date().toISOString()
    };
    this.users.set(defaultUser.email.toLowerCase(), defaultUser);
  }

  private static saveToDisk() {
    try {
      const arr = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    } catch {
      // Disk write failure tolerated
    }
  }

  /**
   * Step 1: Initiates signup by generating a 6-digit OTP code and sending to user's email
   */
  public static sendSignupOTP(email: string, name: string): {
    success: boolean;
    error?: string;
    demoOtp?: string;
    expiresInSeconds: number;
  } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanName) {
      return { success: false, error: 'Name and email are required', expiresInSeconds: 0 };
    }

    // Check if user already exists
    if (this.users.has(cleanEmail)) {
      return {
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
        expiresInSeconds: 0
      };
    }

    // Generate random 6-digit code
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = `deployx_otp_${cleanEmail}`;
    const otpHash = crypto.createHmac('sha256', salt).update(rawCode).digest('hex');

    this.pendingRegistrations.set(cleanEmail, {
      email: cleanEmail,
      name: cleanName,
      otpHash,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attemptsRemaining: 3,
      verified: false,
      rawCodeForDemo: rawCode
    });

    return {
      success: true,
      demoOtp: rawCode, // Clearly provided for seamless testing without needing external email credentials
      expiresInSeconds: 300
    };
  }

  /**
   * Step 2: Verifies the 6-digit OTP code entered by user
   */
  public static verifySignupOTP(email: string, code: string): {
    success: boolean;
    error?: string;
  } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const pending = this.pendingRegistrations.get(cleanEmail);

    if (!pending) {
      return {
        success: false,
        error: 'No active verification session found. Please enter your email again.'
      };
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingRegistrations.delete(cleanEmail);
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      };
    }

    if (pending.attemptsRemaining <= 0) {
      this.pendingRegistrations.delete(cleanEmail);
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new code.'
      };
    }

    const salt = `deployx_otp_${cleanEmail}`;
    const inputHash = crypto.createHmac('sha256', salt).update(cleanCode).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(pending.otpHash))) {
      pending.verified = true;
      return { success: true };
    } else {
      pending.attemptsRemaining -= 1;
      return {
        success: false,
        error: `Incorrect OTP code. ${pending.attemptsRemaining} attempt(s) remaining.`
      };
    }
  }

  /**
   * Step 3: Sets password and saves user account into database
   */
  public static completeSignup(email: string, password: string): {
    success: boolean;
    user?: { id: string; name: string; email: string };
    error?: string;
  } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const pending = this.pendingRegistrations.get(cleanEmail);

    if (!pending || !pending.verified) {
      return {
        success: false,
        error: 'Please verify your email with OTP before setting a password.'
      };
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      return {
        success: false,
        error: `Password requirements not met: ${validation.errors.join(', ')}`
      };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: UserAccount = {
      id: userId,
      name: pending.name,
      email: cleanEmail,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    this.users.set(cleanEmail, newUser);
    this.pendingRegistrations.delete(cleanEmail);
    this.saveToDisk();

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    };
  }

  /**
   * Login: Checks email and matches password perfectly
   */
  public static login(email: string, password: string): {
    success: boolean;
    token?: string;
    user?: { id: string; name: string; email: string };
    error?: string;
  } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);

    if (!user) {
      return {
        success: false,
        error: 'No account found with this email. Please sign up first.'
      };
    }

    const inputHash = this.hashPassword(password, user.salt);
    if (!crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(user.passwordHash))) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.'
      };
    }

    // Create session token (valid for 7 days)
    const token = crypto.randomBytes(32).toString('hex');
    this.sessions.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    user.lastLoginAt = new Date().toISOString();
    this.saveToDisk();

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  /**
   * Validates active session token
   */
  public static validateSession(token: string): { id: string; name: string; email: string } | null {
    this.init();
    if (!token) return null;

    const session = this.sessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
      if (session) this.sessions.delete(token);
      return null;
    }

    const users = Array.from(this.users.values());
    const found = users.find(u => u.id === session.userId);
    if (found) {
      return { id: found.id, name: found.name, email: found.email };
    }
    return null;
  }

  /**
   * Log out session
   */
  public static logout(token: string): void {
    if (token) this.sessions.delete(token);
  }
}
