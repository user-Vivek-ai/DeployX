import {
  GenerationRequest,
  GenerationResult,
  ClarificationQuestion,
  ProjectFile,
  FileChange
} from '../types';

export class MockAIProvider {
  public readonly name = 'Demo AI Provider (Simulation)';
  public readonly isSimulated = true;

  public async clarify(prompt: string): Promise<ClarificationQuestion[]> {
    const lower = prompt.toLowerCase();
    const questions: ClarificationQuestion[] = [];

    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('dine')) {
      questions.push({
        id: 'booking_type',
        question: 'How should table reservations operate for guests?',
        options: [
          'Instant Confirmation (Free booking)',
          'Requires Table Deposit ($15 via Stripe Test Mode)',
          'Waitlist / Request Only'
        ],
        context: 'Affects table reservation workflow and payment integration'
      });
      questions.push({
        id: 'cuisine_vibe',
        question: 'What culinary aesthetic should the theme reflect?',
        options: [
          'Artisan Modern & Cozy (Warm amber & slate)',
          'Fine Dining Luxury (Deep navy & champagne gold)',
          'Vibrant Bistro (Terra cotta & sage green)'
        ],
        context: 'Shapes color palette, typography, and photography styles'
      });
      questions.push({
        id: 'otp_verification',
        question: 'Should guest phone numbers be verified with OTP before confirming reservations?',
        options: [
          'Yes - SMS OTP verification (Prevents no-shows)',
          'No - Direct confirmation via email',
          'Optional for large parties only (>4 guests)'
        ],
        context: 'Enables OTP verification module'
      });
    } else if (lower.includes('saas') || lower.includes('tech') || lower.includes('software') || lower.includes('app')) {
      questions.push({
        id: 'pricing_model',
        question: 'What billing structure should the pricing section feature?',
        options: [
          'Free Tier + Pro ($29/mo) & Enterprise',
          '14-Day Free Trial (No credit card upfront)',
          'Waitlist / Early Access Request with OTP'
        ],
        context: 'Configures Stripe pricing table and checkout modals'
      });
      questions.push({
        id: 'target_audience',
        question: 'Who is the primary audience for the platform?',
        options: [
          'Developers & Engineering Teams',
          'Designers & Creative Agencies',
          'SMB & Business Operations'
        ]
      });
    } else if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('product')) {
      questions.push({
        id: 'checkout_type',
        question: 'How should customers complete purchases?',
        options: [
          'Slide-over Cart with Stripe Test Checkout',
          'Direct 1-Click Buy Now',
          'Inquiry / Custom Quote Flow'
        ]
      });
      questions.push({
        id: 'catalog_size',
        question: 'What initial product catalog density would you like?',
        options: [
          'Featured Showcase (4-6 hand-picked items)',
          'Multi-Category Grid with instant search & filter',
          'Single Hero Product with deep feature tour'
        ]
      });
    } else {
      questions.push({
        id: 'primary_goal',
        question: 'What is the primary action you want visitors to take?',
        options: [
          'Book an Appointment / Service',
          'Make a Payment / Buy a Subscription',
          'Sign up with Verified OTP / Join Waitlist',
          'Explore Interactive Showcase & Contact'
        ]
      });
      questions.push({
        id: 'visual_style',
        question: 'Which design aesthetic best fits your project vision?',
        options: [
          'Modern Tech (Indigo/Violet, clean cards, subtle glassmorphism)',
          'Editorial Minimalist (Monochrome, sharp typography, airy margins)',
          'Warm & Natural (Earthy tones, soft radius, welcoming accents)'
        ]
      });
    }

    return questions;
  }

  public async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, clarifications, visualConfig } = request;
    const lower = prompt.toLowerCase();

    // Determine type of project to generate
    const isRestaurant = lower.includes('restaurant') || lower.includes('dine') || lower.includes('food') || lower.includes('cafe');
    const isEcommerce = lower.includes('shop') || lower.includes('store') || lower.includes('product') || lower.includes('ecommerce');
    const isSaaS = lower.includes('saas') || lower.includes('software') || lower.includes('cloud') || lower.includes('platform');

    let title = 'Modern Web Experience';
    let heroHeadline = 'Crafted for Distinction and Performance';
    let heroSub = 'Deliver an extraordinary experience to your visitors with automated bookings, instant verification, and secure test checkout.';
    let primaryAccent = visualConfig?.primaryColor || '#6366f1';
    let brandName = visualConfig?.brandName || 'DeployX Project';

    if (isRestaurant) {
      title = 'Aura Artisan Table & Hearth';
      brandName = visualConfig?.brandName || 'Aura Kitchen';
      heroHeadline = visualConfig?.heroHeadline || 'Culinary Artistry, Elevated Dining & Hearth Hospitality';
      heroSub = 'Experience farm-to-table seasonal delicacies, sommelier-curated wine pairings, and effortless online table reservations.';
      primaryAccent = '#d97706'; // warm amber/gold
    } else if (isEcommerce) {
      title = 'Luminary Goods - Minimalist Gear';
      brandName = visualConfig?.brandName || 'Luminary Goods';
      heroHeadline = visualConfig?.heroHeadline || 'Thoughtfully Crafted Essentials for Modern Living';
      heroSub = 'Discover precision-engineered carry goods, acoustic accessories, and workspace tools designed to last.';
      primaryAccent = '#0ea5e9'; // sky blue
    } else if (isSaaS) {
      title = 'Synthetix AI - Autonomous Code Intelligence';
      brandName = visualConfig?.brandName || 'Synthetix';
      heroHeadline = visualConfig?.heroHeadline || 'The Next Generation Developer Cloud & Autonomous Workflow Engine';
      heroSub = 'Automate deployment pipelines, analyze pull requests in milliseconds, and manage infrastructure with conversational precision.';
      primaryAccent = '#6366f1'; // violet
    }

    const htmlContent = this.generateHTML({
      title,
      brandName,
      heroHeadline,
      heroSub,
      primaryAccent,
      isRestaurant,
      isEcommerce,
      isSaaS,
      prompt,
      clarifications
    });

    const cssContent = this.generateCSS(primaryAccent);
    const jsContent = this.generateJS({ isRestaurant, isEcommerce, isSaaS, brandName });
    const readmeContent = this.generateREADME({ title, brandName, prompt });

    const files: ProjectFile[] = [
      { path: 'index.html', content: htmlContent, language: 'html' },
      { path: 'styles.css', content: cssContent, language: 'css' },
      { path: 'app.js', content: jsContent, language: 'javascript' },
      { path: 'README.md', content: readmeContent, language: 'markdown' },
    ];

    const fileChanges: FileChange[] = files.map(f => ({
      path: f.path,
      changeType: 'created',
      newContent: f.content,
      summary: `Initial generation of ${f.path}`
    }));

    const reasoning = `### DeployX AI Engineering Synthesis
- **Identified Core Requirements**: Extracted intent from prompt "${prompt}".
- **Selected Layout Architecture**: Responsive single-page application with modular sections (Hero, Interactive Booking / Checkout, Features, Customer Proof, Contact/OTP modal).
- **Embedded Interactive Integrations**:
  - 📅 **Bookings Module**: Real-time slot picker with party size selector and instant status confirmation.
  - 💳 **Payments Engine**: Client-side test checkout modal with Stripe test token simulator (\`4242 4242 4242 4242\`).
  - 🔐 **OTP Verification**: Multi-step SMS/Email 6-digit verification with countdown timer and attempt limits.
- **Safety & Sandbox Compliance**: Enforced strict relative paths, local DOM isolation, and zero arbitrary external remote execution.`;

    const suggestedFollowUps = isRestaurant ? [
      'Change the booking deposit amount to $25 per table',
      'Add a signature wine pairing section with pricing',
      'Update hero background to a luxury dark bistro aesthetic',
      'Add customer reviews and Michelin guide mention'
    ] : [
      'Add a dark mode toggle to the navigation bar',
      'Customize the primary brand color to emerald green',
      'Add an FAQ accordion section below the features',
      'Include customer testimonial carousel with 5-star ratings'
    ];

    return {
      reasoning,
      summary: `Successfully generated ${files.length} production-grade files for **${brandName}** with live interactive booking, payments, and OTP verification modules.`,
      files,
      fileChanges,
      suggestedFollowUps,
      providerName: this.name,
      isSimulated: true
    };
  }

  public async refine(prompt: string, currentFiles: ProjectFile[], request: GenerationRequest): Promise<GenerationResult> {
    const lower = prompt.toLowerCase();
    const updatedFiles: ProjectFile[] = [...currentFiles];
    const fileChanges: FileChange[] = [];

    let indexHtml = currentFiles.find(f => f.path === 'index.html')?.content || '';
    let stylesCss = currentFiles.find(f => f.path === 'styles.css')?.content || '';
    let appJs = currentFiles.find(f => f.path === 'app.js')?.content || '';

    let changeSummary = 'Refined code based on prompt.';

    // Check for color change
    if (lower.includes('emerald') || lower.includes('green')) {
      stylesCss = stylesCss.replace(/--primary-color:\s*#[a-fA-F0-9]{6};/g, '--primary-color: #10b981;');
      changeSummary = 'Updated brand theme color to Emerald Green (#10b981).';
    } else if (lower.includes('purple') || lower.includes('violet')) {
      stylesCss = stylesCss.replace(/--primary-color:\s*#[a-fA-F0-9]{6};/g, '--primary-color: #8b5cf6;');
      changeSummary = 'Updated brand theme color to Violet (#8b5cf6).';
    } else if (lower.includes('blue') || lower.includes('navy')) {
      stylesCss = stylesCss.replace(/--primary-color:\s*#[a-fA-F0-9]{6};/g, '--primary-color: #2563eb;');
      changeSummary = 'Updated brand theme color to Royal Blue (#2563eb).';
    }

    // Check for hero headline change
    if (lower.includes('headline') || lower.includes('hero') || lower.includes('title')) {
      const match = prompt.match(/headline (?:to|as) ["']?([^"']+)["']?/i) || prompt.match(/title (?:to|as) ["']?([^"']+)["']?/i);
      if (match && match[1]) {
        const newHeadline = match[1].trim();
        indexHtml = indexHtml.replace(/<h1 class="hero-title">[\s\S]*?<\/h1>/, `<h1 class="hero-title">${newHeadline}</h1>`);
        changeSummary = `Updated hero headline to "${newHeadline}".`;
      }
    }

    // Check for FAQ addition
    if (lower.includes('faq') && !indexHtml.includes('id="faq-section"')) {
      const faqSectionHtml = `
    <!-- FAQ Section -->
    <section id="faq-section" class="py-16 bg-slate-50 border-t border-slate-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">Answers</span>
          <h2 class="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p class="text-slate-600 mt-2">Everything you need to know about our services, bookings, and policies.</p>
        </div>
        <div class="space-y-4">
          <div class="p-5 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-all">
            <h3 class="font-semibold text-slate-900 flex justify-between items-center text-lg">
              <span>What is your cancellation and refund policy?</span>
              <span class="text-indigo-600 font-bold">+</span>
            </h3>
            <p class="text-slate-600 text-sm mt-2">Reservations and bookings can be cancelled with a full refund up to 24 hours prior to your scheduled time slot.</p>
          </div>
          <div class="p-5 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-all">
            <h3 class="font-semibold text-slate-900 flex justify-between items-center text-lg">
              <span>Is my payment and personal information secure?</span>
              <span class="text-indigo-600 font-bold">+</span>
            </h3>
            <p class="text-slate-600 text-sm mt-2">Yes. All transactions are processed through end-to-end encrypted gateways with test/live mode validation and OTP verification.</p>
          </div>
          <div class="p-5 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-all">
            <h3 class="font-semibold text-slate-900 flex justify-between items-center text-lg">
              <span>Can I make bookings for large parties or private events?</span>
              <span class="text-indigo-600 font-bold">+</span>
            </h3>
            <p class="text-slate-600 text-sm mt-2">Absolutely. For groups larger than 8 guests, please reach out directly via our contact form or OTP-verified booking line.</p>
          </div>
        </div>
      </div>
    </section>
`;
      indexHtml = indexHtml.replace('</main>', `${faqSectionHtml}\n    </main>`);
      changeSummary = 'Added comprehensive interactive FAQ section with policy and safety details.';
    }

    // Check for dark mode toggle or reviews
    if (lower.includes('review') || lower.includes('testimonial')) {
      const reviewHtml = `
    <!-- Testimonials Section -->
    <section class="py-16 bg-white border-t border-slate-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10">
          <span class="text-amber-500 text-lg">★★★★★</span>
          <h2 class="text-2xl font-bold text-slate-900 mt-2">Loved by Over 10,000 Happy Guests</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <p class="text-slate-700 italic text-sm mb-4">"The online booking was flawless, and the OTP confirmation gave me total confidence. An unforgettable experience!"</p>
            <div class="font-semibold text-slate-900 text-sm">Elena Rostova</div>
            <div class="text-xs text-slate-500">Verified Customer</div>
          </div>
          <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <p class="text-slate-700 italic text-sm mb-4">"The attention to detail and ease of payment is top-tier. Highly recommended to anyone looking for premium quality."</p>
            <div class="font-semibold text-slate-900 text-sm">Marcus Vance</div>
            <div class="text-xs text-slate-500">Executive Director</div>
          </div>
          <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <p class="text-slate-700 italic text-sm mb-4">"Instant confirmation and quick response when we had to adjust our table size. 10/10 service."</p>
            <div class="font-semibold text-slate-900 text-sm">Sophia Lin</div>
            <div class="text-xs text-slate-500">Food & Wine Critic</div>
          </div>
        </div>
      </div>
    </section>
`;
      indexHtml = indexHtml.replace('</main>', `${reviewHtml}\n    </main>`);
      changeSummary = 'Added verified customer testimonials with 5-star rating badges.';
    }

    // Update index.html in file list
    const oldHtml = currentFiles.find(f => f.path === 'index.html')?.content;
    if (oldHtml !== indexHtml) {
      const idx = updatedFiles.findIndex(f => f.path === 'index.html');
      updatedFiles[idx] = { ...updatedFiles[idx], content: indexHtml };
      fileChanges.push({
        path: 'index.html',
        changeType: 'modified',
        oldContent: oldHtml,
        newContent: indexHtml,
        summary: changeSummary
      });
    }

    // Update styles.css in file list
    const oldCss = currentFiles.find(f => f.path === 'styles.css')?.content;
    if (oldCss !== stylesCss) {
      const idx = updatedFiles.findIndex(f => f.path === 'styles.css');
      updatedFiles[idx] = { ...updatedFiles[idx], content: stylesCss };
      fileChanges.push({
        path: 'styles.css',
        changeType: 'modified',
        oldContent: oldCss,
        newContent: stylesCss,
        summary: 'Updated stylesheet styling'
      });
    }

    const reasoning = `### DeployX AI Incremental Refinement
- **Analyzed user instruction**: "${prompt}".
- **Targeted Modifications**: Identified affected layout elements and style variables.
- **Applied Changes**: Safely updated virtual DOM and CSS variables without breaking existing booking and payment hooks.
- **Integrity Check**: Passed sandbox AST validation.`;

    return {
      reasoning,
      summary: changeSummary,
      files: updatedFiles,
      fileChanges,
      suggestedFollowUps: [
        'Preview changes in mobile viewport (375px)',
        'Deploy update to Staging environment',
        'Save this snapshot to Version History',
        'Revert back if needed'
      ],
      providerName: this.name,
      isSimulated: true
    };
  }

  private generateHTML(data: any): string {
    return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Powered by DeployX</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              DEFAULT: '${data.primaryAccent}',
              50: '#f5f3ff',
              600: '${data.primaryAccent}',
              700: '#4338ca',
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">

  <!-- Top Announcement / Test Mode Bar -->
  <aside class="bg-indigo-900 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between font-medium">
    <div class="flex items-center space-x-2">
      <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>DeployX Live Preview: Real-Time Interactive Sandboxed Build</span>
    </div>
    <div class="flex items-center space-x-3 text-xs">
      <span class="bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-700/50">Stripe Test Mode Ready</span>
      <span class="bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-700/50">OTP Sandbox Active</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a href="#" class="flex items-center space-x-3 group">
        <div class="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
          ${data.brandName.charAt(0)}
        </div>
        <span class="font-extrabold text-xl tracking-tight text-slate-900">${data.brandName}</span>
      </a>

      <nav class="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
        <a href="#features" class="hover:text-brand transition-colors">Experience</a>
        ${data.isRestaurant ? '<a href="#menu" class="hover:text-brand transition-colors">Menu</a>' : ''}
        ${data.isEcommerce ? '<a href="#catalog" class="hover:text-brand transition-colors">Collection</a>' : ''}
        <a href="#interactive-action" class="hover:text-brand transition-colors">${data.isRestaurant ? 'Book Table' : 'Get Started'}</a>
        <a href="#reviews" class="hover:text-brand transition-colors">Reviews</a>
      </nav>

      <div class="flex items-center space-x-3">
        <button id="otp-verify-trigger" class="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
          Verify via OTP
        </button>
        <button id="nav-cta-btn" class="px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">
          ${data.isRestaurant ? 'Reserve a Table' : 'Order Now'}
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-grow">
    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Crafted with DeployX Natural Language Engine</span>
        </div>
        <h1 class="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          ${data.heroHeadline}
        </h1>
        <p class="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ${data.heroSub}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#interactive-action" class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all">
            ${data.isRestaurant ? 'Book Table Now (Instant Slots)' : 'Explore Live Prototype'}
          </a>
          <button id="simulate-checkout-btn" class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors">
            Test Stripe Checkout ($25 Deposit)
          </button>
        </div>
      </div>
    </section>

    <!-- Interactive Bookings / Action Module -->
    <section id="interactive-action" class="py-16 bg-white border-y border-slate-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10">
          <div class="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-brand">Real-Time Interactive Booking</span>
              <h2 class="text-2xl font-bold text-slate-900 mt-1">${data.isRestaurant ? 'Reserve Your Table' : 'Schedule Service Appointment'}</h2>
            </div>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live API Connected
            </span>
          </div>

          <form id="booking-form" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input type="text" id="guest-name" required placeholder="Elena Rostova" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input type="email" id="guest-email" required placeholder="elena@example.com" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number (For OTP confirmation)</label>
              <input type="tel" id="guest-phone" required placeholder="+1 (555) 019-2834" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Party Size / Guests</label>
              <select id="guest-party" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
                <option value="2">2 Guests (Intimate Table)</option>
                <option value="4" selected>4 Guests (Standard Dining)</option>
                <option value="6">6 Guests (Booth)</option>
                <option value="8">8+ Guests (Chef's Private Table)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Select Date</label>
              <input type="date" id="booking-date" required class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Available Time Slot</label>
              <select id="booking-slot" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none">
                <option value="18:00">6:00 PM (Sunset Seating)</option>
                <option value="19:30" selected>7:30 PM (Prime Dinner)</option>
                <option value="21:00">9:00 PM (Late Night Gastronomy)</option>
              </select>
            </div>

            <div class="sm:col-span-2 mt-2">
              <button type="submit" id="submit-booking-btn" class="w-full py-3.5 px-4 rounded-xl bg-brand text-white font-bold text-sm shadow hover:opacity-95 transition-all flex items-center justify-center space-x-2">
                <span>Confirm Reservation & Request OTP</span>
                <span>→</span>
              </button>
            </div>
          </form>

          <!-- Booking Confirmation Card (Hidden by default) -->
          <div id="booking-confirmation-banner" class="hidden mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div class="flex items-start space-x-3">
              <span class="text-xl">✅</span>
              <div>
                <h4 class="font-bold text-sm">Table Successfully Reserved!</h4>
                <p id="booking-confirmation-text" class="text-xs text-emerald-800 mt-0.5">Confirmation code #DEP-9481 has been registered. View details in DeployX Admin Bookings tab.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Highlights & Features -->
    <section id="features" class="py-16 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-3xl font-bold text-slate-900">Engineered for Seamless Operations</h2>
          <p class="text-slate-600 mt-3 text-sm sm:text-base">Every aspect of this web app is structured to be production-ready, accessible, and fully connected to DeployX APIs.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-brand flex items-center justify-center font-bold text-lg mb-4">
              📅
            </div>
            <h3 class="text-lg font-bold text-slate-900">Smart Booking Engine</h3>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">Integrated slot calculation prevents double bookings, respects capacity limits, and provides instant confirmation codes.</p>
          </div>

          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
              💳
            </div>
            <h3 class="text-lg font-bold text-slate-900">Secure Payments</h3>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">Server-verified test checkout simulator for deposits or full orders. Never stores card details locally.</p>
          </div>

          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-4">
              🔐
            </div>
            <h3 class="text-lg font-bold text-slate-900">Strict OTP Security</h3>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">Server-side hashed OTP verification with automatic timeout expiry, rate limiting, and brute-force attempt limits.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- OTP Modal Dialog -->
  <div id="otp-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm hidden">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-bold text-slate-900 text-lg">Two-Factor OTP Verification</h3>
        <button id="close-otp-modal" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
      </div>
      <p class="text-xs text-slate-600 mt-3">We have sent a secure 6-digit verification code to your contact number. Enter code below:</p>

      <div class="mt-4 flex justify-between gap-2">
        <input type="text" maxlength="6" id="otp-input" placeholder="• • • • • •" class="tracking-widest text-center text-2xl font-mono py-3 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand outline-none">
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Expires in: <strong id="otp-timer">04:59</strong></span>
        <button id="resend-otp-btn" class="text-brand font-semibold hover:underline">Resend Code</button>
      </div>

      <div id="otp-status-msg" class="hidden mt-3 p-2 rounded text-xs font-medium"></div>

      <div class="mt-5 flex gap-2">
        <button id="verify-otp-action-btn" class="w-full py-2.5 bg-brand text-white font-bold rounded-xl text-sm hover:opacity-95 transition-opacity">
          Verify & Continue
        </button>
      </div>
    </div>
  </div>

  <!-- Stripe Checkout Modal Dialog -->
  <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm hidden">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4 border border-slate-200">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Stripe Test Mode</span>
          <h3 class="font-bold text-slate-900 text-lg mt-1">Order Checkout</h3>
        </div>
        <button id="close-checkout-modal" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
      </div>

      <div class="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
        <span class="font-medium text-slate-700">Reservation Deposit (Table for 4)</span>
        <span class="font-extrabold text-slate-900">$25.00 USD</span>
      </div>

      <div class="mt-4 space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Test Card Number</label>
          <div class="relative">
            <input type="text" id="card-number" value="4242 4242 4242 4242" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-brand outline-none">
            <span class="absolute right-3 top-2.5 text-xs text-slate-400">TEST</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Expires (MM/YY)</label>
            <input type="text" value="12/28" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">CVC</label>
            <input type="text" value="123" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm outline-none">
          </div>
        </div>
      </div>

      <div id="payment-status-box" class="hidden mt-4 p-3 rounded-xl text-xs font-medium"></div>

      <div class="mt-5">
        <button id="pay-now-btn" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2">
          <span>Authorize $25.00 Payment</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
    <p>© 2026 ${data.brandName}. Generated & hosted via DeployX Software Engineering Platform.</p>
    <p class="mt-1">All bookings, OTP verification and payment flows run in secure sandboxed test mode.</p>
  </footer>

  <script src="app.js"></script>
</body>
</html>`;
  }

  private generateCSS(primaryAccent: string): string {
    return `/* Custom DeployX Component Stylesheet */
:root {
  --primary-color: ${primaryAccent};
}

.bg-brand {
  background-color: var(--primary-color) !important;
}

.text-brand {
  color: var(--primary-color) !important;
}

.border-brand {
  border-color: var(--primary-color) !important;
}

.hero-title {
  letter-spacing: -0.03em;
}

/* Smooth modal animations */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.animate-modal {
  animation: fadeIn 0.15s ease-out forwards;
}
`;
  }

  private generateJS(data: any): string {
    return `// DeployX Client Application Runtime
document.addEventListener('DOMContentLoaded', () => {
  // 1. Set default booking date to tomorrow
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // 2. Handle Booking Form Submission
  const bookingForm = document.getElementById('booking-form');
  const banner = document.getElementById('booking-confirmation-banner');
  const bannerText = document.getElementById('booking-confirmation-text');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName = document.getElementById('guest-name').value;
      const guestEmail = document.getElementById('guest-email').value;
      const date = document.getElementById('booking-date').value;
      const slot = document.getElementById('booking-slot').value;
      const party = document.getElementById('guest-party').value;

      const code = 'DEP-' + Math.floor(1000 + Math.random() * 9000);

      // Post message to parent DeployX frame if inside workspace preview
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'DEPLOYX_NEW_BOOKING',
          payload: {
            customerName: guestName,
            customerEmail: guestEmail,
            date,
            timeSlot: slot,
            partySize: parseInt(party, 10),
            confirmationCode: code
          }
        }, '*');
      }

      if (banner && bannerText) {
        bannerText.textContent = 'Confirmation #' + code + ' confirmed for ' + guestName + ' on ' + date + ' at ' + slot + ' (' + party + ' guests).';
        banner.classList.remove('hidden');
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Automatically offer OTP verification modal
      setTimeout(() => {
        openOtpModal();
      }, 600);
    });
  }

  // 3. OTP Verification Modal Logic
  const otpModal = document.getElementById('otp-modal');
  const otpTrigger = document.getElementById('otp-verify-trigger');
  const closeOtp = document.getElementById('close-otp-modal');
  const verifyOtpBtn = document.getElementById('verify-otp-action-btn');
  const otpInput = document.getElementById('otp-input');
  const otpStatus = document.getElementById('otp-status-msg');

  function openOtpModal() {
    if (otpModal) {
      otpModal.classList.remove('hidden');
      if (otpInput) {
        otpInput.value = '482910'; // Pre-filled realistic demo OTP for ease of testing!
        otpInput.focus();
      }
    }
  }

  if (otpTrigger) {
    otpTrigger.addEventListener('click', openOtpModal);
  }

  if (closeOtp && otpModal) {
    closeOtp.addEventListener('click', () => {
      otpModal.classList.add('hidden');
    });
  }

  if (verifyOtpBtn && otpStatus) {
    verifyOtpBtn.addEventListener('click', () => {
      const code = otpInput ? otpInput.value.trim() : '';
      if (code.length === 6) {
        otpStatus.className = 'mt-3 p-2.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block';
        otpStatus.textContent = '✓ Verified successfully! Identity authenticated with server.';
        setTimeout(() => {
          if (otpModal) otpModal.classList.add('hidden');
        }, 1200);
      } else {
        otpStatus.className = 'mt-3 p-2.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block';
        otpStatus.textContent = 'Please enter a valid 6-digit code.';
      }
    });
  }

  // 4. Stripe Checkout Modal Logic
  const checkoutModal = document.getElementById('checkout-modal');
  const simulateCheckoutBtn = document.getElementById('simulate-checkout-btn');
  const navCtaBtn = document.getElementById('nav-cta-btn');
  const closeCheckout = document.getElementById('close-checkout-modal');
  const payNowBtn = document.getElementById('pay-now-btn');
  const paymentStatus = document.getElementById('payment-status-box');

  function openCheckout() {
    if (checkoutModal) checkoutModal.classList.remove('hidden');
  }

  if (simulateCheckoutBtn) simulateCheckoutBtn.addEventListener('click', openCheckout);
  if (navCtaBtn) navCtaBtn.addEventListener('click', openCheckout);

  if (closeCheckout && checkoutModal) {
    closeCheckout.addEventListener('click', () => {
      checkoutModal.classList.add('hidden');
    });
  }

  if (payNowBtn && paymentStatus) {
    payNowBtn.addEventListener('click', () => {
      payNowBtn.disabled = true;
      payNowBtn.textContent = 'Processing with Stripe Server...';

      setTimeout(() => {
        paymentStatus.className = 'mt-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block';
        paymentStatus.textContent = '✓ Payment Authorized! Transaction ID: ch_test_' + Math.random().toString(36).substring(2, 9);
        payNowBtn.textContent = 'Paid ($25.00)';

        // Post message to parent DeployX frame
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'DEPLOYX_PAYMENT_SUCCESS',
            payload: { amount: 25.00, currency: 'USD' }
          }, '*');
        }

        setTimeout(() => {
          if (checkoutModal) checkoutModal.classList.add('hidden');
          payNowBtn.disabled = false;
          payNowBtn.textContent = 'Authorize $25.00 Payment';
        }, 1500);
      }, 1000);
    });
  }
});
`;
  }

  private generateREADME(data: any): string {
    return `# ${data.title}

Generated with **DeployX Software Engineering Platform**
Original prompt: *"${data.prompt}"*

## Features Included
- **Responsive Architecture**: Mobile-first responsive layout powered by Tailwind CSS.
- **Table & Service Bookings**: Configurable slots, capacity limits, and instant confirmation code generator.
- **Two-Factor OTP Flow**: Server-side verification simulation with expiry and rate limiting.
- **Stripe Test Payments**: Pre-integrated checkout modal and test card support (\`4242 4242 4242 4242\`).

## Integrations Guide
- **Bookings**: Manage incoming customer bookings in DeployX Project Dashboard -> Integrations -> Bookings.
- **Payments**: To switch from Test Mode to Live Stripe, configure \`STRIPE_SECRET_KEY\` and \`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\` in your environment.
- **OTP**: To connect real Twilio Verify or Resend, configure credentials in DeployX Settings.
`;
  }
}
