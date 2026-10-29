# DeployX - Autonomous Software Engineering Platform

DeployX is a polished, production-minded platform that helps teams and creators **create, preview, edit, and deploy websites and web applications using natural-language instructions**.

It combines clear conversational reasoning, automated requirement clarification, interactive sandboxed preview, split-pane code & visual editing, version rollbacks, and a deployment pipeline with optional integrations for **Bookings**, **Two-Factor OTP**, and **Stripe Payments**.

---

## 🚀 Key Features & Capabilities

### 1. Conversational Builder & AI Architecture
- **Natural-Language Synthesis**: Describe any app (e.g. *"Build an artisan restaurant with table bookings, $25 Stripe deposit checkout, and SMS OTP verification"*).
- **Intelligent Clarification**: DeployX detects missing parameters (e.g., table deposit requirements, design aesthetic, 2FA necessity) and asks 2–3 concise multiple-choice questions before generating.
- **Provider Adapter Pattern**: Server-side abstraction (`src/lib/ai/adapter.ts`) allowing seamless switching between:
  - **Demo AI Provider (Simulation)**: Rich, intelligent multi-file code generator with step-by-step reasoning tokens, realistic domain blueprints, and zero cost.
  - **OpenAI (GPT-4o)**
  - **Anthropic (Claude 3.5 Sonnet)**
  - **Google Gemini (1.5 Flash / Pro)**
- **Sandbox Security & Untrusted Code Guard**: Validates file paths, strictly forbids directory traversal (`../`) and absolute paths, checks syntax, and never executes arbitrary generated shell commands.

### 2. Live Interactive Sandboxed Preview
- **In-Browser Runtime**: Renders generated HTML/CSS/JS in an isolated, sandboxed iframe with Tailwind CSS support.
- **Responsive Viewport Controls**: 1-click toggles for Desktop (100%), Tablet (768px), and Mobile (375px), plus full-window popout preview.
- **Bi-Directional PostMessage Event Bridge**:
  - Live customer bookings submitted inside the preview update the project's booking database in real time.
  - Test payments authorized inside the preview log verified transactions to the server audit log.
  - JavaScript runtime errors trigger non-intrusive alerts with an instant **"Ask DeployX to Repair"** button.

### 3. Visual Customizer & Code Studio
- **Code Editor**: File tree explorer, syntax highlighting, line numbers, manual code editing with unsaved change alerts, file creation, and deletion.
- **Visual Studio**: Tweak theme colors (Indigo, Violet, Emerald, Amber, Rose, etc.), typography, hero headlines, CTA copy, and toggle feature modules with instant live preview updates.
- **1-Click ZIP Export**: Download the complete project package (HTML, CSS, JS, manifest) as a `.zip` archive via JSZip.

### 4. Version Control & Zero-Risk Rollbacks
- **Automatic Checkpoints**: Snapshots are captured before any AI modification or manual file edit.
- **Timeline & Diff Inspector**: Inspect past version numbers, authors, commit messages, and file manifests.
- **Safe 1-Click Rollback**: Revert project files to any prior snapshot without risk of data loss.

### 5. Production Integrations (Bookings, OTP, Payments)
- **Bookings Module**:
  - Configurable services, time slots, capacity rules, and anti-duplicate booking prevention.
  - Admin view of received reservations with status controls (`Pending`, `Confirmed`, `Completed`, `Cancelled`).
  - Privacy & GDPR tool: Purge customer records by email with 1 click.
- **Two-Factor OTP Security**:
  - Server-side SHA-256 HMAC verification (OTP secrets are never sent to client or logged in plaintext).
  - 5-minute expiration countdown, rate-limiting cooldowns, and brute-force attempt limits.
  - Built-in interactive OTP test simulator. Supports Twilio Verify and Resend.
- **Stripe Payments**:
  - Test mode checkout simulator with test card support (`4242 4242 4242 4242`).
  - Server-side webhook signature verification. Card details are never stored.
  - Transaction audit trail logging payment amounts, currencies, and timestamps.

### 6. Deployment Pipeline
- Multi-environment target support: **Production**, **Staging**, and **Preview**.
- Live streaming build logs with timestamped phases: `Validate` ➔ `Build` ➔ `Optimize` ➔ `Edge Deploy`.
- Verified live deployment URL displayed only upon confirmed success.
- Labeled local sandbox simulation with simple switch to Vercel/Netlify deployment webhooks.

---

## 🛠️ Stack Architecture & Justification

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/) with React 18 and TypeScript.
  - *Justification*: Provides secure server-side routes (`/api/...`) where API keys and OTP secrets remain strictly confidential on the server, paired with high-performance client-side interactive React components.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom developer theme palette:
  - Deep navy text (`#0f172a`), subtle borders (`#e2e8f0`), violet/blue accent colors (`#6366f1` / `#4f46e5`).
- **Icons**: [Lucide React](https://lucide.dev/) for crisp, consistent iconography.
- **Packaging**: [JSZip](https://stuk.github.io/jszip/) for client/server zip generation.
- **Storage**: In-memory store with disk persistence (`.deployx_data.json`) for zero-configuration local execution that survives reloads.

---

## 📦 Getting Started (Local Development Guide)

### Prerequisites
- Node.js `v18.17+` or `v20+` (tested on Node `v24.21.0`)
- npm, pnpm, or yarn

### 1. Installation
Clone or navigate to the project directory:
```bash
cd D:\3-1\SESD\DeployX
npm install
```

### 2. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```
*(DeployX runs out of the box in High-Fidelity Simulation Mode without any external keys required!)*

### 3. Development Server
Start the local Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Verification
```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables & Credentials Reference

| Variable | Description | Default / Demo Behavior |
| :--- | :--- | :--- |
| `AI_PROVIDER` | Active AI adapter (`auto`, `mock`, `openai`, `anthropic`, `gemini`) | Defaults to `mock` (Simulation) |
| `OPENAI_API_KEY` | Secret key for OpenAI GPT-4o | Optional. When omitted, simulation mode runs |
| `ANTHROPIC_API_KEY` | Secret key for Anthropic Claude 3.5 Sonnet | Optional |
| `GEMINI_API_KEY` | Secret key for Google Gemini 1.5 | Optional |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) | When omitted, built-in test checkout simulator runs |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) | Optional placeholder |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | Used for server webhook verification |
| `OTP_PROVIDER` | `demo`, `twilio`, or `resend` | Defaults to `demo` with built-in sandbox tester |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for real SMS | Optional |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Optional |
| `TWILIO_SERVICE_SID` | Twilio Verify Service SID | Optional |
| `DEPLOYMENT_PROVIDER` | `local` or `vercel` | Defaults to `local` sandbox simulation |

---

## 🔒 Security Architecture Highlights

1. **Untrusted Code Sanitizer**: Model outputs pass through `CodeSecurityValidator` before writing to virtual file trees. Directory traversal (`../`) and forbidden OS paths are blocked.
2. **Server-Side Secret Isolation**: Model API keys, OTP secrets, and Stripe webhook tokens never touch browser bundles.
3. **Safe Sandboxed Iframe Execution**: Live preview frames are isolated with `sandbox="allow-scripts allow-modals allow-forms allow-same-origin"`, preventing access to parent session storage or cookies.
4. **GDPR / Privacy Compliance**: Direct endpoint `/api/projects/[id]/bookings` with HTTP `DELETE` to purge customer PII on demand.

---

## 📝 Demo vs. Live Production Status Summary

- **AI Code Synthesis**: Fully operational in Simulation Mode with domain-specific architecture generation, step-by-step reasoning traces, and incremental prompt editing. Connect real OpenAI/Gemini/Anthropic keys anytime in `.env.local`.
- **Bookings**: Fully functional with conflict prevention, capacity limits, and real-time synchronization between the preview iframe and DeployX admin dashboard.
- **OTP Verification**: Fully functional with server-side SHA-256 HMAC hashing, rate limits, attempt limits, and test code disclosure in demo mode.
- **Stripe Payments**: Fully functional test checkout modal with test card `4242 4242...` and server webhook simulation.
- **Deployments**: Fully functional local edge deployment simulator with live build streaming and verified URL display.
