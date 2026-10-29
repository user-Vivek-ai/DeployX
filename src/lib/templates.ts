import { Project } from './types';

export interface ProjectTemplate {
  id: string;
  name: string;
  category: 'Hospitality' | 'SaaS' | 'E-Commerce' | 'Portfolio' | 'Developer';
  description: string;
  icon: string;
  badge: string;
  prompt: string;
  suggestedTags: string[];
  features: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'artisan-restaurant',
    name: 'Artisan Restaurant & Table Booking',
    category: 'Hospitality',
    description: 'A cozy farm-to-table restaurant website featuring real-time table reservations, dietary menu filters, Stripe deposit checkout, and SMS OTP verification.',
    icon: 'UtensilsCrossed',
    badge: 'Popular',
    prompt: 'Build an artisan restaurant website with real-time table reservations, $25 deposit payments via Stripe test mode, and SMS OTP verification to prevent no-shows.',
    suggestedTags: ['Restaurant', 'Bookings', 'Stripe', 'OTP', 'Hospitality'],
    features: ['Table Slot Picker', 'Stripe Deposit ($25)', 'OTP Verification', 'Menu Showcase']
  },
  {
    id: 'fintech-saas',
    name: 'Fintech Cloud & Subscriptions',
    category: 'SaaS',
    description: 'High-converting SaaS landing page with interactive pricing tiers, monthly/yearly toggle, Stripe customer billing modal, and waitlist OTP sign-up.',
    icon: 'Layers',
    badge: 'Trending',
    prompt: 'Create a modern Fintech SaaS landing page with interactive pricing tiers ($29/mo Pro, $99/mo Scale), Stripe test checkout, and OTP waitlist verification.',
    suggestedTags: ['SaaS', 'Stripe Subscriptions', 'Dark Mode', 'Waitlist'],
    features: ['Tiered Pricing', 'Monthly/Annual Toggle', 'Instant Checkout Modal', 'Waitlist Form']
  },
  {
    id: 'luminary-ecommerce',
    name: 'Luminary Modern E-Commerce',
    category: 'E-Commerce',
    description: 'Minimalist storefront with responsive product grid, instant category filter, slide-over shopping cart, and test card checkout.',
    icon: 'ShoppingBag',
    badge: 'Featured',
    prompt: 'Build a minimalist lifestyle e-commerce store with product categories, slide-over cart drawer, and Stripe test payment integration.',
    suggestedTags: ['E-Commerce', 'Cart', 'Catalog', 'Payments'],
    features: ['Slide-over Cart', 'Category Filter', 'Order Receipt Generator', 'Inventory Badges']
  },
  {
    id: 'studio-portfolio',
    name: 'Design Studio & Client Discovery',
    category: 'Portfolio',
    description: 'Creative studio showcase with case studies, client testimonial badges, and an interactive 1-on-1 consultation booking calendar.',
    icon: 'Sparkles',
    badge: 'Creative',
    prompt: 'Build a design studio agency portfolio with project case studies, client reviews, and an interactive discovery call booking calendar.',
    suggestedTags: ['Portfolio', 'Agency', 'Consultation', 'Calendar'],
    features: ['Case Studies', 'Discovery Booking', 'OTP Contact', 'Visual Gallery']
  },
  {
    id: 'dev-api-docs',
    name: 'Developer API Hub & Docs',
    category: 'Developer',
    description: 'Clean developer documentation portal with interactive endpoint playground, syntax-highlighted code tabs (cURL, Node, Python), and copy buttons.',
    icon: 'Code2',
    badge: 'Tools',
    prompt: 'Create a developer documentation portal with API endpoint explorer, cURL code copy widgets, and response payload simulator.',
    suggestedTags: ['Documentation', 'API', 'Developer', 'Code Viewer'],
    features: ['Endpoint Explorer', 'Code Copy', 'Payload Sandbox', 'Search Bar']
  }
];
