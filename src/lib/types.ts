export type AIProviderType = 'auto' | 'mock' | 'openai' | 'anthropic' | 'gemini' | 'chatgpt';

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  size?: number;
}

export interface FileChange {
  path: string;
  changeType: 'created' | 'modified' | 'deleted';
  oldContent?: string;
  newContent: string;
  summary: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
  context?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  questions?: ClarificationQuestion[];
  suggestedActions?: string[];
  fileChanges?: FileChange[];
  timestamp: string;
  providerUsed?: string;
  isSimulated?: boolean;
}

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  message: string;
  timestamp: string;
  files: ProjectFile[];
  author: string;
  visualConfig?: VisualConfig;
}

export interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  step: 'init' | 'validate' | 'build' | 'optimize' | 'deploy';
}

export interface Deployment {
  id: string;
  projectId: string;
  environment: 'production' | 'staging' | 'preview';
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  logs: DeploymentLog[];
  url?: string;
  commitHash: string;
  createdAt: string;
  completedAt?: string;
  isSimulation: boolean;
  versionNumber: number;
}

export interface Booking {
  id: string;
  projectId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  partySize: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BookingConfig {
  enabled: boolean;
  services: Array<{ id: string; name: string; duration: string; price: number }>;
  operatingHours: { start: string; end: string };
  maxPartySize: number;
  timezone: string;
  requireDeposit: boolean;
  depositAmount?: number;
  confirmationMessage: string;
}

export interface OTPConfig {
  enabled: boolean;
  provider: 'demo' | 'twilio' | 'resend';
  codeLength: number;
  expiryMinutes: number;
  maxAttempts: number;
  isConfigured: boolean;
}

export interface PaymentConfig {
  enabled: boolean;
  provider: 'demo' | 'stripe';
  currency: string;
  testMode: boolean;
  publishableKey?: string;
  isConfigured: boolean;
}

export interface VisualConfig {
  primaryColor: string;
  fontFamily: string;
  brandName: string;
  tagline: string;
  heroHeadline: string;
  ctaText: string;
  enableBookingsBanner: boolean;
  enablePaymentCheckout: boolean;
  enableOtpVerification: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  initialPrompt: string;
  tags: string[];
  status: 'draft' | 'building' | 'ready' | 'deployed';
  files: ProjectFile[];
  messages: ChatMessage[];
  versions: VersionSnapshot[];
  deployments: Deployment[];
  visualConfig: VisualConfig;
  bookingConfig: BookingConfig;
  otpConfig: OTPConfig;
  paymentConfig: PaymentConfig;
  aiProvider: AIProviderType;
  createdAt: string;
  updatedAt: string;
  activeDeploymentUrl?: string;
}

export interface GenerationRequest {
  projectId: string;
  prompt: string;
  clarifications?: Record<string, string>;
  currentFiles?: ProjectFile[];
  visualConfig?: VisualConfig;
}

export interface GenerationResult {
  reasoning: string;
  summary: string;
  files: ProjectFile[];
  fileChanges: FileChange[];
  suggestedFollowUps: string[];
  providerName: string;
  isSimulated: boolean;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded';
  ai: {
    activeProvider: string;
    isMock: boolean;
    availableProviders: Array<{ name: string; keyConfigured: boolean }>;
  };
  integrations: {
    stripeTestMode: boolean;
    stripeConfigured: boolean;
    otpProvider: string;
    otpConfigured: boolean;
    deploymentProvider: string;
  };
  serverTime: string;
}
