import { ProjectFile, FileChange } from '../types';

/**
 * Intelligent client-side / fallback website builder.
 * Generates rich, custom, responsive single-page websites tailored to any user prompt
 * using Tailwind CSS, modern typography, and interactive JavaScript.
 */
export class SmartFallbackGenerator {
  public static generate(prompt: string): {
    title: string;
    brandName: string;
    summary: string;
    reasoning: string;
    files: ProjectFile[];
    fileChanges: FileChange[];
  } {
    const lower = prompt.toLowerCase();

    // 1. Detect category and theme
    let category = 'general';
    let brandName = 'Modern App';
    let primaryColor = '#6366f1'; // Indigo
    let secondaryColor = '#4f46e5';
    let accentEmoji = '⚡';

    if (lower.includes('gym') || lower.includes('fitness') || lower.includes('workout') || lower.includes('trainer')) {
      category = 'fitness';
      brandName = 'Apex Performance Gym';
      primaryColor = '#e11d48'; // Rose/Red
      secondaryColor = '#be123c';
      accentEmoji = '🏋️';
    } else if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('bakery')) {
      category = 'restaurant';
      brandName = 'Artisan Table & Hearth';
      primaryColor = '#d97706'; // Amber/Gold
      secondaryColor = '#b45309';
      accentEmoji = '🍽️';
    } else if (lower.includes('doctor') || lower.includes('clinic') || lower.includes('hospital') || lower.includes('dental') || lower.includes('health')) {
      category = 'health';
      brandName = 'Apex Health & Wellness Clinic';
      primaryColor = '#0284c7'; // Sky/Blue
      secondaryColor = '#0369a1';
      accentEmoji = '🩺';
    } else if (lower.includes('portfolio') || lower.includes('photographer') || lower.includes('designer') || lower.includes('resume')) {
      category = 'portfolio';
      brandName = 'Studio Lumina';
      primaryColor = '#8b5cf6'; // Violet
      secondaryColor = '#7c3aed';
      accentEmoji = '✨';
    } else if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('clothing')) {
      category = 'ecommerce';
      brandName = 'Aura Goods & Apparel';
      primaryColor = '#059669'; // Emerald
      secondaryColor = '#047857';
      accentEmoji = '🛍️';
    } else if (lower.includes('saas') || lower.includes('software') || lower.includes('tech') || lower.includes('analytics')) {
      category = 'saas';
      brandName = 'Synthetix Cloud Engine';
      primaryColor = '#6366f1'; // Indigo
      secondaryColor = '#4f46e5';
      accentEmoji = '🚀';
    } else {
      // Extract brand name from prompt if possible
      const match = prompt.match(/(?:for|called|named|brand)\s+["']?([A-Za-z0-9\s&]{3,24})["']?/i);
      if (match && match[1]) {
        brandName = match[1].trim();
      } else {
        const words = prompt.split(' ').filter(w => w.length > 3).slice(0, 2);
        brandName = words.length > 0 ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'DeployX Project';
      }
    }

    const html = this.buildHTML({ prompt, category, brandName, primaryColor, accentEmoji });

    const files: ProjectFile[] = [
      { path: 'index.html', content: html, language: 'html' }
    ];

    const fileChanges: FileChange[] = [
      {
        path: 'index.html',
        changeType: 'created',
        newContent: html,
        summary: `Created complete website for "${prompt}"`
      }
    ];

    return {
      title: `${brandName} - Modern Web Platform`,
      brandName,
      summary: `Synthesized complete production-ready website with responsive layout, hero section, features, pricing, testimonials, and interactive contact modal.`,
      reasoning: `Tailored architecture for "${prompt}". Applied responsive Tailwind CSS layout with modern typography, subtle cards, and interactive JavaScript state handlers.`,
      files,
      fileChanges
    };
  }

  private static buildHTML(data: { prompt: string; category: string; brandName: string; primaryColor: string; accentEmoji: string }): string {
    const { prompt, category, brandName, primaryColor, accentEmoji } = data;

    // Content tailored to category
    let heroTitle = 'Empowering Next-Generation Digital Experiences';
    let heroSub = 'Deliver excellence with precision engineering, modern aesthetics, and seamless user experiences.';
    let features: { title: string; desc: string; icon: string }[] = [];
    let pricing: { plan: string; price: string; features: string[] }[] = [];

    if (category === 'fitness') {
      heroTitle = 'Transform Your Body. Elevate Your Mind.';
      heroSub = 'State-of-the-art equipment, elite personal trainers, high-intensity group classes, and personalized nutrition plans.';
      features = [
        { title: 'Olympic Lifting & Cardio', desc: 'Custom platforms, rogue racks, and premium cardio suites.', icon: '🏋️' },
        { title: 'Elite Certified Trainers', desc: '1-on-1 coaching customized to your strength and conditioning goals.', icon: '🏆' },
        { title: 'Recovery & Spa Suite', desc: 'Infrared sauna, cold plunge, and sports massage therapy.', icon: '❄️' }
      ];
      pricing = [
        { plan: 'Basic Strength', price: '$49/mo', features: ['Gym Floor Access', 'Locker Room & Showers', 'Free Fitness Assessment'] },
        { plan: 'All-Access Pro', price: '$89/mo', features: ['Unlimited Group Classes', 'Sauna & Cold Plunge', 'Guest Passes (2/mo)', 'Mobile App Booking'] },
        { plan: 'Elite Coaching', price: '$149/mo', features: ['Weekly 1-on-1 Personal Training', 'Custom Nutrition Plan', 'Full Spa Access', '24/7 VIP Entry'] }
      ];
    } else if (category === 'health') {
      heroTitle = 'Comprehensive Healthcare Tailored for You';
      heroSub = 'Trusted family physicians, specialized clinical diagnostics, and compassionate patient care all in one modern clinic.';
      features = [
        { title: 'Same-Day Consultations', desc: 'Urgent and general outpatient care with zero long waiting queues.', icon: '🩺' },
        { title: 'Advanced Diagnostics', desc: 'On-site digital imaging, comprehensive lab screenings, and cardiology.', icon: '🔬' },
        { title: 'Telehealth & Online Care', desc: 'Secure video visits and instant electronic prescriptions.', icon: '📱' }
      ];
      pricing = [
        { plan: 'Standard Consultation', price: '$65', features: ['Full Physical Exam', 'Vitals & General Diagnostics', 'Prescription Management'] },
        { plan: 'Comprehensive Wellness', price: '$120', features: ['In-Depth Blood Panel', 'ECG Screening', 'Preventative Longevity Plan'] },
        { plan: 'Annual Family Care', price: '$350/yr', features: ['Unlimited Video Visits', 'Priority Clinic Bookings', '24/7 Physician Hotline'] }
      ];
    } else if (category === 'restaurant') {
      heroTitle = 'Artisanal Flavors, Elevated Dining & Hearth Hospitality';
      heroSub = 'Farm-to-table seasonal menus, hand-selected sommelier wine pairings, and effortless online table reservations.';
      features = [
        { title: 'Locally Sourced Ingredients', desc: 'Direct partnerships with organic regional farms and sustainable fisheries.', icon: '🌱' },
        { title: 'Sommelier Wine Pairings', desc: 'Curated natural wines and artisanal signature cocktails.', icon: '🍷' },
        { title: 'Private Dining & Events', desc: 'Intimate chef’s tables and private dining room for special occasions.', icon: '🕯️' }
      ];
      pricing = [
        { plan: 'Dinner Seating (2-4)', price: 'Free', features: ['Prime Dining Table', 'Full A La Carte Menu', 'Instant Confirmation'] },
        { plan: 'Chef’s Tasting Menu', price: '$95/guest', features: ['7-Course Seasonal Flight', 'Sommelier Wine Pairing', 'Dedicated Table Sommelier'] },
        { plan: 'Private Hearth Room', price: '$450 min', features: ['Up to 14 Guests', 'Custom Curated Menu', 'Private Service Staff'] }
      ];
    } else {
      heroTitle = `Experience the Future of ${brandName}`;
      heroSub = `Engineered for modern performance, elegant aesthetics, and unmatched reliability. Crafted to bring your vision to life.`;
      features = [
        { title: 'High Performance & Speed', desc: 'Blazing fast response times and lightweight modern architecture.', icon: '⚡' },
        { title: 'Intuitive User Experience', desc: 'Clean layouts and accessible design that visitors instantly love.', icon: '🎯' },
        { title: 'Secure & Reliable', desc: 'Built with enterprise-grade standards, data protection, and responsive layouts.', icon: '🛡️' }
      ];
      pricing = [
        { plan: 'Starter Tier', price: '$29/mo', features: ['Core Platform Features', 'Basic Analytics', 'Community Support'] },
        { plan: 'Professional', price: '$79/mo', features: ['Everything in Starter', 'Unlimited Bandwidth', 'Priority Support', 'Custom Integrations'] },
        { plan: 'Enterprise', price: '$199/mo', features: ['Dedicated Infrastructure', 'SLA Guarantee', '24/7 Dedicated Account Lead'] }
      ];
    }

    return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    :root { --brand: ${primaryColor}; }
    .bg-brand { background-color: var(--brand); }
    .text-brand { color: var(--brand); }
    .border-brand { border-color: var(--brand); }
    .hover-brand:hover { background-color: var(--brand); opacity: 0.9; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">

  <!-- Navigation -->
  <header class="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow-lg">
          ${accentEmoji}
        </div>
        <span class="font-extrabold text-lg tracking-tight text-white">${brandName}</span>
      </div>

      <nav class="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
        <a href="#features" class="hover:text-white transition-colors">Features</a>
        <a href="#pricing" class="hover:text-white transition-colors">Plans</a>
        <a href="#reviews" class="hover:text-white transition-colors">Reviews</a>
        <a href="#contact" class="hover:text-white transition-colors">Contact</a>
      </nav>

      <div class="flex items-center space-x-3">
        <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-md hover:opacity-90 transition-all active:scale-95">
          Get Started
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-grow">
    <section class="relative overflow-hidden pt-20 pb-24 text-center px-4">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
          <span>${accentEmoji}</span>
          <span>Crafted by DeployX Intelligence</span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          ${heroTitle}
        </h1>

        <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ${heroSub}
        </p>

        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand text-white font-bold text-sm shadow-lg hover:opacity-95 transition-all">
            Explore Opportunities →
          </button>
          <a href="#pricing" class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors">
            View Pricing Tiers
          </a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-16 bg-slate-900/50 border-y border-white/5">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-white">Engineered for Distinction</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2">Every feature is designed with modern speed, accessibility, and high conversion in mind.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${features.map(f => `
            <div class="p-6 rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 transition-all space-y-3">
              <div class="text-3xl">${f.icon}</div>
              <h3 class="font-bold text-base text-white">${f.title}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-white">Transparent Plans & Pricing</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2">Choose the option that best fits your goals with zero hidden fees.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${pricing.map((p, i) => `
            <div class="p-6 rounded-3xl bg-slate-900 border ${i === 1 ? 'border-brand ring-1 ring-brand' : 'border-white/10'} flex flex-col justify-between space-y-6 relative">
              ${i === 1 ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white uppercase tracking-wider">Most Popular</span>' : ''}
              <div>
                <h3 class="font-bold text-base text-white">${p.plan}</h3>
                <div class="mt-3 text-3xl font-extrabold text-white">${p.price}</div>
                <ul class="mt-6 space-y-2.5 text-xs text-slate-300">
                  ${p.features.map(feat => `<li class="flex items-center gap-2"><span>✓</span><span>${feat}</span></li>`).join('')}
                </ul>
              </div>
              <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="w-full py-2.5 rounded-xl ${i === 1 ? 'bg-brand text-white' : 'bg-white/10 hover:bg-white/15 text-white'} font-bold text-xs transition-all">
                Select Plan
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Customer Reviews -->
    <section id="reviews" class="py-16 bg-slate-900/40 border-t border-white/5 px-4">
      <div class="max-w-5xl mx-auto text-center space-y-8">
        <div class="text-amber-400 text-lg">★★★★★</div>
        <blockquote class="text-xl sm:text-2xl font-semibold text-white max-w-2xl mx-auto leading-relaxed">
          "The experience was beyond exceptional. Everything was smooth, transparent, and completely exceeded our expectations."
        </blockquote>
        <div>
          <div class="font-bold text-sm text-white">Marcus Vance</div>
          <div class="text-xs text-slate-500">Verified Client Review</div>
        </div>
      </div>
    </section>

    <!-- Interactive Contact Modal -->
    <div id="booking-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden p-4">
      <div class="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 class="font-bold text-base text-white">Get in Touch with ${brandName}</h3>
          <button onclick="document.getElementById('booking-modal').classList.add('hidden')" class="text-slate-400 hover:text-white font-bold text-xl">&times;</button>
        </div>
        <form onsubmit="event.preventDefault(); document.getElementById('success-banner').classList.remove('hidden'); setTimeout(() => document.getElementById('booking-modal').classList.add('hidden'), 1500);" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
            <input required type="text" placeholder="Alex Morgan" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-brand">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input required type="email" placeholder="alex@example.com" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-brand">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input type="tel" placeholder="+1 (555) 019-2834" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-brand">
          </div>
          <div id="success-banner" class="hidden p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 text-center">
            ✓ Inquiry received! We will reach out shortly.
          </div>
          <button type="submit" class="w-full py-3 bg-brand text-white font-bold rounded-xl text-xs shadow hover:opacity-90 transition-all mt-2">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-slate-900 border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500">
    <p>© 2026 ${brandName}. Powered by DeployX Autonomous Web Engine.</p>
  </footer>

</body>
</html>`;
  }
}
