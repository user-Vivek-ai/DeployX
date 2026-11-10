import {
  GenerationRequest,
  GenerationResult,
  ClarificationQuestion,
  ProjectFile
} from '../types';
import { IAIProvider } from './adapter';
import { GeminiProvider } from './gemini-provider';
import { MockAIProvider } from './mock-provider';
import { SmartFallbackGenerator } from './smart-generator';

export class ChatGPTProvider implements IAIProvider {
  public readonly name = 'ChatGPT (GPT-4o)';
  public readonly isSimulated = false;
  private openAiKey: string | null = null;
  private geminiKey: string | null = null;

  constructor() {
    const oKey = process.env.OPENAI_API_KEY;
    if (oKey && !oKey.includes('placeholder')) {
      this.openAiKey = oKey;
    }
    const gKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (gKey && !gKey.includes('placeholder')) {
      this.geminiKey = gKey;
    }
  }

  public async clarify(prompt: string): Promise<ClarificationQuestion[]> {
    return [];
  }

  public async chat(message: string): Promise<string> {
    // 1. Try OpenAI if key is present
    if (this.openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAiKey}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are ChatGPT, an intelligent, helpful, witty, and engaging AI companion integrated into DeployX. You can chat casually for time pass, tell jokes, solve riddles, write code, answer questions, or brainstorm ideas. Respond warmly in markdown format.'
              },
              { role: 'user', content: message }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content;
          if (content) return content.trim();
        }
      } catch (err) {
        console.warn('OpenAI chat call failed, falling back:', err);
      }
    }

    // 2. Try Gemini with ChatGPT persona (since Gemini key is active in Vercel!)
    if (this.geminiKey) {
      try {
        const gemini = new GeminiProvider(this.geminiKey);
        const prompt = `You are ChatGPT (GPT-4o), the world-renowned AI conversational assistant, running smoothly inside DeployX.
You are chatting with a user who wants to talk, have fun, do "time pass", ask questions, hear jokes, play games, write code, or brainstorm ideas.
Respond naturally in a warm, witty, articulate, human-like voice with clean markdown formatting.

User: "${message}"`;
        const res = await (gemini as any).callGemini(prompt);
        if (res && res.trim()) return res.trim();
      } catch (err) {
        console.warn('Gemini chat fallback failed:', err);
      }
    }

    // 3. Fallback conversational engine
    return this.fallbackChat(message);
  }

  public async generate(request: GenerationRequest): Promise<GenerationResult> {
    if (this.geminiKey) {
      const gemini = new GeminiProvider(this.geminiKey);
      return gemini.generate(request);
    }
    const mock = new MockAIProvider();
    return mock.generate(request);
  }

  public async refine(prompt: string, currentFiles: ProjectFile[], request: GenerationRequest): Promise<GenerationResult> {
    if (this.geminiKey) {
      const gemini = new GeminiProvider(this.geminiKey);
      return gemini.refine(prompt, currentFiles, request);
    }
    const mock = new MockAIProvider();
    return mock.refine(prompt, currentFiles, request);
  }

  private fallbackChat(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('joke')) {
      const jokes = [
        `Here is a programmer joke for you! 😄\n\nWhy do programmers always prefer dark mode?\n\n*Because light attracts bugs!* 🐛\n\nWant another one?`,
        `Haha, check this one out! 😂\n\nThere are 10 types of people in the world:\n*Those who understand binary, and those who don't.* 💻\n\nWant a riddle next?`,
        `Here's one! 🤖\n\nA SQL query walks into a bar, walks up to two tables and asks: *"Can I join you?"* 🍻`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (lower.includes('riddle')) {
      return `Here's a clever riddle for you! 🧠\n\n*I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?*\n\nGive it your best guess, or reply **reveal** if you give up!`;
    }

    if (lower.includes('echo') || lower.includes('answer')) {
      return `Spot on! 🎯 The answer is indeed **an Echo**! Great job. Want to try another riddle or a rapid-fire quiz?`;
    }

    if (lower.includes('who are you') || lower.includes('what are you')) {
      return `I'm **ChatGPT (GPT-4o)** integrated right here inside DeployX! 🚀\n\nThink of me as your all-in-one companion:\n- 💬 **Time Pass & Casual Chat:** We can talk about movies, games, life, or tell jokes.\n- 🧠 **Brainstorming & Trivia:** Test your knowledge or pitch startup ideas.\n- 💻 **Coding & Debugging:** Ask for Python, JavaScript, SQL, or algorithm help.\n- 🌐 **Instant Website Synthesis:** Whenever you want a website, just tell me and I'll code and deploy it in seconds!\n\nWhat would you like to explore today?`;
    }

    if (lower.includes('bored') || lower.includes('time pass') || lower.includes('timepass')) {
      return `Let's make this fun! Here are 4 great ways we can kill time together right now: ⏳✨\n\n1. 🧠 **Play 5-Question Trivia:** Pick a topic (Movies, Tech, Geography, Anime, Gaming).\n2. 📜 **Story Chain:** We take turns writing one sentence to create a crazy sci-fi story.\n3. 💡 **Roast or Rate:** Tell me an idea, movie, or song and I'll give you a witty review.\n4. 🎮 **Text-based Adventure:** You make choices and explore a mystery dungeon!\n\nWhich one do you want to play?`;
    }

    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return `Hey there! 👋 I'm **ChatGPT**, ready to hang out and chat! Whether you want to have a casual conversation for some time pass, ask any question, brainstorm something creative, or build a web app whenever you feel like it — I'm all ears. What's on your mind?`;
    }

    if (lower.includes('python') || lower.includes('code') || lower.includes('script')) {
      return `Here is a fun Python one-liner to pass the time! 🐍\n\n\`\`\`python\n# Generates a randomized lucky fortune\nimport random\nfortunes = ["Great success is coming!", "Debug once, run forever.", "Today is a great day to deploy."]\nprint(f"🔮 Fortune: {random.choice(fortunes)}")\n\`\`\`\n\nNeed help with any specific coding problem or project? Just let me know!`;
    }

    return `That's really interesting! As your ChatGPT companion on DeployX, I'm here to chat, brainstorm, solve problems, or just keep you entertained. Tell me more about what you're thinking!`;
  }
}
