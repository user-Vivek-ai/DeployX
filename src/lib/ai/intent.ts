/**
 * Detects whether the user's prompt is intended to build/edit a website
 * or is just a general conversation / ChatGPT time-pass query.
 */
export function isWebsiteIntent(prompt: string, hasExistingFiles: boolean = false): boolean {
  if (!prompt || !prompt.trim()) return false;
  const lower = prompt.toLowerCase().trim();

  // 1. Pure conversational, greeting, or time-pass triggers
  const pureChatPhrases = [
    'joke', 'riddle', 'poem', 'story', 'time pass', 'timepass', 'bored',
    'who are you', 'what is your name', 'how are you', 'hello', 'hi ', 'hey',
    'good morning', 'good evening', 'good night', 'thank you', 'thanks',
    'what can you do', 'tell me about', 'explain', 'what is', 'who is',
    'why is', 'sing a song', 'chat with me', 'talk with me', 'who made you',
    'who created you', 'tell me something', 'fun fact', 'talk to me',
    'play a game', 'quiz me', 'trivia', 'recommend a movie', 'how to pass time',
    'write python', 'write a function', 'write code to', 'write script to',
    'translate', 'calculate', 'solve', 'help me with homework'
  ];

  // If prompt explicitly contains pure chat markers and DOES NOT explicitly request a website
  const hasPureChat = pureChatPhrases.some(p => lower.startsWith(p) || lower.includes(p));
  const hasExplicitWebKeywords = ['website', 'landing page', 'web page', 'web app', 'portfolio site', 'store site', 'clone site', 'html page'].some(k => lower.includes(k));

  if (hasPureChat && !hasExplicitWebKeywords) {
    return false;
  }

  // 2. If there are existing website files, check if this is an explicit website edit request
  if (hasExistingFiles) {
    const editKeywords = [
      'change', 'update', 'add', 'remove', 'make', 'color', 'background',
      'price', 'pricing', 'rupee', 'inr', 'dollar', 'hero', 'footer',
      'header', 'button', 'font', 'section', 'layout', 'image', 'text',
      'card', 'modal', 'form', 'contact', 'dark', 'light', 'fix', 'replace',
      '₹', '€', '£', '$', 'menu', 'nav', 'testimonial', 'faq', 'headline',
      'title', 'border', 'padding', 'margin', 'style', 'redesign', 'align'
    ];
    if (editKeywords.some(k => lower.includes(k))) {
      return true;
    }
    // If none of the edit keywords matched and it's conversational, treat as chat
    return false;
  }

  // 3. New project: check for explicit website creation keywords
  const buildKeywords = [
    'build', 'create a website', 'make a website', 'generate a website',
    'design a website', 'landing page', 'portfolio', 'web app', 'html',
    'website for', 'site for', 'store for', 'clone of', 'restaurant website',
    'gym website', 'clinic website', 'ecommerce website', 'saas website',
    'develop a website', 'frontend', 'single page', 'application for',
    'web template', 'web portal', 'showcase website'
  ];

  if (buildKeywords.some(k => lower.includes(k))) {
    return true;
  }

  // Default: if it's general text, questions, or conversation, it's ChatGPT chat mode
  return false;
}
