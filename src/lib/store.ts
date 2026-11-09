import fs from 'fs';
import path from 'path';
import os from 'os';
import { Project, ProjectFile, VersionSnapshot, Deployment, DeploymentLog } from './types';
import { MockAIProvider } from './ai/mock-provider';

// Use os.tmpdir() to ensure write permissions on Vercel serverless functions
const DATA_FILE = path.join(os.tmpdir(), '.deployx_data.json');

export class ProjectStore {
  private static projects: Map<string, Project> = new Map();
  private static initialized = false;

  private static init() {
    if (this.initialized) return;

    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const list: Project[] = JSON.parse(raw);
        for (const p of list) {
          this.projects.set(p.id, p);
        }
        this.initialized = true;
        return;
      }
    } catch {
      // If error reading, re-seed
    }

    // Seed with high quality sample project
    this.seedDefaultProjects();
    this.saveToDisk();
    this.initialized = true;
  }

  private static saveToDisk() {
    try {
      const arr = Array.from(this.projects.values());
      fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    } catch {
      // Disk write failure silently tolerated in memory
    }
  }

  private static seedDefaultProjects() {
    const mock = new MockAIProvider();

    // 1. Aura Restaurant
    const p1Id = 'proj-restaurant-01';
    const now = new Date();

    const p1: Project = {
      id: p1Id,
      name: 'Aura Artisan Table & Hearth',
      description: 'Farm-to-table culinary restaurant with online reservations, $25 deposit checkout via Stripe test mode, and SMS OTP verification.',
      initialPrompt: 'Build an artisan restaurant website with real-time table reservations, $25 deposit payments via Stripe test mode, and SMS OTP verification.',
      tags: ['Restaurant', 'Bookings', 'Stripe', 'OTP'],
      status: 'deployed',
      activeDeploymentUrl: 'https://aura-hearth.deployx.preview',
      files: [
        {
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Artisan Table & Hearth</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans">
  <aside class="bg-indigo-900 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between font-medium">
    <div class="flex items-center space-x-2">
      <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>DeployX Live Sandboxed Environment</span>
    </div>
    <div class="flex items-center space-x-3 text-xs">
      <span class="bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-700/50">Stripe Test Mode Ready</span>
      <span class="bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-700/50">OTP Sandbox Active</span>
    </div>
  </aside>

  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <a href="#" class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">A</div>
        <span class="font-extrabold text-xl tracking-tight text-slate-900">Aura Kitchen</span>
      </a>
      <div class="flex items-center space-x-4">
        <button id="otp-verify-trigger" class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-100">Verify via OTP</button>
        <a href="#interactive-action" class="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold shadow-sm hover:opacity-90">Reserve a Table</a>
      </div>
    </div>
  </header>

  <main class="py-12">
    <section class="max-w-4xl mx-auto px-4 text-center">
      <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider mb-4">Michelin Guide Recommended</span>
      <h1 class="hero-title text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Culinary Artistry, Elevated Dining & Hearth Hospitality
      </h1>
      <p class="mt-4 text-slate-600 text-base max-w-2xl mx-auto">
        Experience seasonal farm-to-table tasting courses and sommelier pairings. Instant table reservations powered by DeployX.
      </p>
    </section>

    <!-- Interactive Table Booking Section -->
    <section id="interactive-action" class="mt-12 max-w-3xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Table Reservation</span>
            <h2 class="text-xl font-bold text-slate-900">Select Date & Time Slot</h2>
          </div>
          <span class="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Available</span>
        </div>

        <form id="booking-form" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input type="text" id="guest-name" value="Elena Rostova" required class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input type="email" id="guest-email" value="elena@example.com" required class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Party Size</label>
            <select id="guest-party" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="2">2 Guests</option>
              <option value="4" selected>4 Guests (Booth)</option>
              <option value="6">6 Guests</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
            <select id="booking-slot" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="18:00">6:00 PM</option>
              <option value="19:30" selected>7:30 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <button type="submit" class="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow">
              Confirm Reservation & Request OTP
            </button>
          </div>
        </form>

        <div id="booking-confirmation-banner" class="hidden mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          <strong>✓ Reservation Confirmed!</strong> Code #DEP-8291 recorded in DeployX Bookings admin.
        </div>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>`
        },
        {
          path: 'styles.css',
          language: 'css',
          content: `:root {
  --primary-color: #d97706;
}
.hero-title {
  letter-spacing: -0.03em;
}`
        },
        {
          path: 'app.js',
          language: 'javascript',
          content: `document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  const banner = document.getElementById('booking-confirmation-banner');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (banner) banner.classList.remove('hidden');
    });
  }
});`
        },
        {
          path: 'README.md',
          language: 'markdown',
          content: '# Aura Artisan Table & Hearth\n\nGenerated with DeployX Platform.'
        }
      ],
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Build an artisan restaurant website with real-time table reservations, $25 deposit payments via Stripe test mode, and SMS OTP verification.',
          timestamp: new Date(now.getTime() - 3600000 * 2).toISOString()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I have analyzed your requirements and generated the first complete working version of **Aura Kitchen**. It includes interactive table slot reservation, Stripe deposit checkout simulator, and OTP verification flow.',
          reasoning: 'Synthesized restaurant domain models, created responsive HTML layout with Tailwind CSS, embedded interactive booking form.',
          timestamp: new Date(now.getTime() - 3600000 * 2 + 15000).toISOString(),
          providerUsed: 'Demo AI Provider (Simulation)',
          isSimulated: true,
          suggestedActions: [
            'Change hero headline to "Award-Winning Woodfired Hearth Dining"',
            'Add customer reviews section',
            'Switch primary color to Emerald Green'
          ]
        }
      ],
      versions: [
        {
          id: 'ver-1',
          versionNumber: 1,
          message: 'Initial Generation from Prompt',
          timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
          files: [],
          author: 'DeployX AI'
        }
      ],
      deployments: [
        {
          id: 'dep-1',
          projectId: p1Id,
          environment: 'production',
          status: 'succeeded',
          url: 'https://aura-hearth.deployx.preview',
          commitHash: '7c89f1a',
          createdAt: new Date(now.getTime() - 3600000).toISOString(),
          completedAt: new Date(now.getTime() - 3600000 + 12000).toISOString(),
          isSimulation: true,
          versionNumber: 1,
          logs: [
            { timestamp: '19:00:00', level: 'info', step: 'init', message: 'Deployment initialized for environment [production]' },
            { timestamp: '19:00:02', level: 'info', step: 'validate', message: 'Validated 4 project files and sandbox boundaries' },
            { timestamp: '19:00:05', level: 'info', step: 'build', message: 'Compiled assets and verified HTML syntax' },
            { timestamp: '19:00:08', level: 'info', step: 'optimize', message: 'Asset tree minified. Size: 18.4 KB' },
            { timestamp: '19:00:12', level: 'success', step: 'deploy', message: 'Deployed to local Edge sandbox simulation at https://aura-hearth.deployx.preview' }
          ]
        }
      ],
      visualConfig: {
        primaryColor: '#d97706',
        fontFamily: 'Plus Jakarta Sans',
        brandName: 'Aura Kitchen',
        tagline: 'Artisan Woodfired Hearth',
        heroHeadline: 'Culinary Artistry, Elevated Dining & Hearth Hospitality',
        ctaText: 'Reserve a Table',
        enableBookingsBanner: true,
        enablePaymentCheckout: true,
        enableOtpVerification: true
      },
      bookingConfig: {
        enabled: true,
        services: [
          { id: 'srv_1', name: 'Chef Tasting Menu', duration: '90m', price: 95 },
          { id: 'srv_2', name: 'Standard Table Seating', duration: '75m', price: 0 }
        ],
        operatingHours: { start: '17:00', end: '23:00' },
        maxPartySize: 8,
        timezone: 'America/New_York',
        requireDeposit: true,
        depositAmount: 25,
        confirmationMessage: 'Your table at Aura has been confirmed. We look forward to hosting you!'
      },
      otpConfig: {
        enabled: true,
        provider: 'demo',
        codeLength: 6,
        expiryMinutes: 5,
        maxAttempts: 3,
        isConfigured: false
      },
      paymentConfig: {
        enabled: true,
        provider: 'demo',
        currency: 'USD',
        testMode: true,
        publishableKey: 'pk_test_sample_deployx',
        isConfigured: false
      },
      aiProvider: 'mock',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString()
    };

    // Save snapshot files in version 1
    p1.versions[0].files = [...p1.files];
    this.projects.set(p1Id, p1);
  }

  public static getAllProjects(): Project[] {
    this.init();
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public static getProject(id: string): Project | undefined {
    this.init();
    return this.projects.get(id);
  }

  public static saveProject(project: Project): void {
    this.init();
    project.updatedAt = new Date().toISOString();
    this.projects.set(project.id, project);
    this.saveToDisk();
  }

  public static createProject(params: {
    name: string;
    description: string;
    initialPrompt: string;
    tags?: string[];
    aiProvider?: string;
  }): Project {
    this.init();
    const id = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const project: Project = {
      id,
      name: params.name || 'Untitled Project',
      description: params.description || '',
      initialPrompt: params.initialPrompt || '',
      tags: params.tags || ['Web App'],
      status: 'draft',
      files: [],
      messages: [],
      versions: [],
      deployments: [],
      visualConfig: {
        primaryColor: '#6366f1',
        fontFamily: 'Inter',
        brandName: params.name || 'DeployX Project',
        tagline: 'Modern Web Application',
        heroHeadline: 'Crafted with DeployX Natural Language Platform',
        ctaText: 'Get Started',
        enableBookingsBanner: false,
        enablePaymentCheckout: false,
        enableOtpVerification: false
      },
      bookingConfig: {
        enabled: true,
        services: [{ id: 'srv_1', name: 'General Appointment', duration: '60m', price: 0 }],
        operatingHours: { start: '09:00', end: '18:00' },
        maxPartySize: 6,
        timezone: 'UTC',
        requireDeposit: false,
        confirmationMessage: 'Thank you for your reservation!'
      },
      otpConfig: {
        enabled: true,
        provider: 'demo',
        codeLength: 6,
        expiryMinutes: 5,
        maxAttempts: 3,
        isConfigured: false
      },
      paymentConfig: {
        enabled: true,
        provider: 'demo',
        currency: 'USD',
        testMode: true,
        isConfigured: false
      },
      aiProvider: 'mock',
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(id, project);
    this.saveToDisk();
    return project;
  }

  public static deleteProject(id: string): boolean {
    this.init();
    const result = this.projects.delete(id);
    this.saveToDisk();
    return result;
  }

  public static addVersionSnapshot(projectId: string, message: string, author: string = 'User'): VersionSnapshot | null {
    const project = this.getProject(projectId);
    if (!project) return null;

    const nextVer = (project.versions.length > 0 ? Math.max(...project.versions.map(v => v.versionNumber)) : 0) + 1;
    const snapshot: VersionSnapshot = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      versionNumber: nextVer,
      message,
      timestamp: new Date().toISOString(),
      files: JSON.parse(JSON.stringify(project.files)),
      author,
      visualConfig: JSON.parse(JSON.stringify(project.visualConfig))
    };

    project.versions.unshift(snapshot);
    this.saveProject(project);
    return snapshot;
  }

  public static restoreVersion(projectId: string, versionId: string): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    const targetVer = project.versions.find(v => v.id === versionId);
    if (!targetVer) return false;

    // Snapshot current state before restoring
    this.addVersionSnapshot(projectId, `Auto-saved before restoring v${targetVer.versionNumber}`, 'DeployX Guard');

    project.files = JSON.parse(JSON.stringify(targetVer.files));
    if (targetVer.visualConfig) {
      project.visualConfig = JSON.parse(JSON.stringify(targetVer.visualConfig));
    }

    this.saveProject(project);
    return true;
  }
}
