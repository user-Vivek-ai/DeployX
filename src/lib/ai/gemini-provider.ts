import {
  GenerationRequest,
  GenerationResult,
  ClarificationQuestion,
  ProjectFile,
  FileChange
} from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiProvider {
  public readonly name = 'Google Gemini 1.5 Flash';
  public readonly isSimulated = false;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  public async clarify(prompt: string): Promise<ClarificationQuestion[]> {
    const systemPrompt = `You are DeployX AI assistant. A user wants to build: "${prompt}"
    
Return ONLY a JSON array (no markdown, no explanation) of 2-3 essential follow-up questions to understand what they need.
Each question must have exactly these fields:
- id: short snake_case string
- question: the question to ask
- options: array of exactly 3 short answer choices
- context: one sentence why this matters

Example format:
[{"id":"color_scheme","question":"What color theme?","options":["Dark & Modern","Light & Clean","Colorful & Bold"],"context":"Determines the visual style"}]

Questions should be specific to: "${prompt}"`;

    try {
      const raw = await this.callGemini(systemPrompt);
      // Extract JSON from response
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      throw new Error('No valid JSON array found');
    } catch {
      // Fallback generic questions
      return [
        {
          id: 'purpose',
          question: 'What is the main purpose of this website?',
          options: ['Showcase / Portfolio', 'Sell Products or Services', 'Provide Information / Blog'],
          context: 'Shapes the layout and core features'
        },
        {
          id: 'style',
          question: 'What visual style do you prefer?',
          options: ['Modern & Minimal', 'Bold & Colorful', 'Professional & Corporate'],
          context: 'Determines colors, fonts, and design language'
        }
      ];
    }
  }

  public async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, clarifications } = request;

    // Build clarification context
    const clarificationEntries = clarifications ? Object.entries(clarifications) : [];
    const clarificationText = clarificationEntries.length > 0
      ? '\n\nUser answered these follow-up questions:\n' +
        clarificationEntries.map(([q, a]) => `- ${q}: ${a}`).join('\n')
      : '';

    const systemPrompt = `You are DeployX, an expert web developer AI. Build a complete, beautiful, production-quality website based on this request:

USER REQUEST: "${prompt}"${clarificationText}

Generate a FULL single-page website with:
1. Modern, polished design with great typography and spacing
2. Responsive layout (works on mobile, tablet, desktop)
3. All content relevant to the user's specific request
4. Interactive elements (forms, modals, animations where appropriate)
5. Professional color scheme matching the topic
6. Real, meaningful content (not lorem ipsum)

REQUIREMENTS:
- Use Tailwind CSS via CDN for styling
- Use vanilla JavaScript for interactivity
- Make it visually impressive and modern
- Include proper navigation, hero section, main content sections, and footer
- All content must be specific to: "${prompt}"

Return ONLY a JSON object with exactly this structure (no markdown code blocks, no explanation, just raw JSON):
{
  "title": "Page title",
  "brandName": "Brand/site name",
  "summary": "One sentence describing what was built",
  "reasoning": "Brief explanation of design choices",
  "html": "COMPLETE index.html content (full HTML document with embedded Tailwind CDN)",
  "css": "Additional CSS beyond Tailwind",
  "js": "Complete JavaScript for interactivity"
}

The html field must be a COMPLETE, standalone HTML file that works in a browser.`;

    try {
      const raw = await this.callGemini(systemPrompt);

      // Try to extract JSON
      let jsonStr = raw;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // If JSON parse fails, extract content manually
        parsed = this.extractContentManually(raw, prompt);
      }

      const title = parsed.title || `${prompt} Website`;
      const brandName = parsed.brandName || title;
      const htmlContent = parsed.html || this.buildFallbackHTML(prompt, parsed);
      const cssContent = parsed.css || '';
      const jsContent = parsed.js || '';
      const summary = parsed.summary || `Generated a complete website for: ${prompt}`;
      const reasoning = parsed.reasoning || `Built a custom website based on your request: "${prompt}"`;

      const files: ProjectFile[] = [
        { path: 'index.html', content: htmlContent, language: 'html' },
        ...(cssContent ? [{ path: 'styles.css', content: cssContent, language: 'css' as const }] : []),
        ...(jsContent ? [{ path: 'app.js', content: jsContent, language: 'javascript' as const }] : []),
      ];

      const fileChanges: FileChange[] = files.map(f => ({
        path: f.path,
        changeType: 'created' as const,
        newContent: f.content,
        summary: `Generated ${f.path} for "${prompt}"`
      }));

      return {
        reasoning: `### DeployX AI — Powered by Google Gemini\n${reasoning}`,
        summary,
        files,
        fileChanges,
        suggestedFollowUps: [
          'Change the color scheme to something different',
          'Add a contact form with email validation',
          'Make the hero section more visually striking',
          'Add a pricing section',
          'Include customer testimonials',
          'Add smooth scroll animations'
        ],
        providerName: this.name,
        isSimulated: false
      };
    } catch (error: any) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  public async refine(prompt: string, currentFiles: ProjectFile[], request: GenerationRequest): Promise<GenerationResult> {
    const currentHtml = currentFiles.find(f => f.path === 'index.html')?.content || '';
    const currentCss = currentFiles.find(f => f.path === 'styles.css')?.content || '';
    const currentJs = currentFiles.find(f => f.path === 'app.js')?.content || '';

    const systemPrompt = `You are DeployX AI. The user wants to modify their existing website.

MODIFICATION REQUEST: "${prompt}"

CURRENT HTML:
${currentHtml.slice(0, 6000)}

CURRENT CSS:
${currentCss.slice(0, 1000)}

Apply the requested changes and return ONLY a JSON object (no markdown, no explanation):
{
  "summary": "One sentence describing what changed",
  "reasoning": "What you changed and why",
  "html": "COMPLETE updated index.html",
  "css": "Updated CSS (or empty string if unchanged)",
  "js": "Updated JavaScript (or empty string if unchanged)"
}

Make ONLY the changes the user asked for. Keep everything else the same.`;

    try {
      const raw = await this.callGemini(systemPrompt);

      let jsonStr = raw;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // If we can't parse JSON, return current files with a note
        return {
          reasoning: `Attempted to apply: "${prompt}"`,
          summary: `Modification attempted: ${prompt}`,
          files: currentFiles,
          fileChanges: [],
          suggestedFollowUps: ['Try rephrasing your request', 'Be more specific about what to change'],
          providerName: this.name,
          isSimulated: false
        };
      }

      const updatedFiles: ProjectFile[] = [...currentFiles];
      const fileChanges: FileChange[] = [];

      if (parsed.html) {
        const htmlIdx = updatedFiles.findIndex(f => f.path === 'index.html');
        const oldContent = htmlIdx >= 0 ? updatedFiles[htmlIdx].content : '';
        if (htmlIdx >= 0) {
          updatedFiles[htmlIdx] = { ...updatedFiles[htmlIdx], content: parsed.html };
        } else {
          updatedFiles.push({ path: 'index.html', content: parsed.html, language: 'html' });
        }
        fileChanges.push({ path: 'index.html', changeType: 'modified', oldContent, newContent: parsed.html, summary: parsed.summary });
      }

      if (parsed.css) {
        const cssIdx = updatedFiles.findIndex(f => f.path === 'styles.css');
        if (cssIdx >= 0) {
          updatedFiles[cssIdx] = { ...updatedFiles[cssIdx], content: parsed.css };
        } else {
          updatedFiles.push({ path: 'styles.css', content: parsed.css, language: 'css' });
        }
        fileChanges.push({ path: 'styles.css', changeType: 'modified', newContent: parsed.css, summary: 'Updated styles' });
      }

      if (parsed.js) {
        const jsIdx = updatedFiles.findIndex(f => f.path === 'app.js');
        if (jsIdx >= 0) {
          updatedFiles[jsIdx] = { ...updatedFiles[jsIdx], content: parsed.js };
        } else {
          updatedFiles.push({ path: 'app.js', content: parsed.js, language: 'javascript' });
        }
        fileChanges.push({ path: 'app.js', changeType: 'modified', newContent: parsed.js, summary: 'Updated scripts' });
      }

      return {
        reasoning: `### DeployX AI — Powered by Google Gemini\n${parsed.reasoning || prompt}`,
        summary: parsed.summary || `Applied: ${prompt}`,
        files: updatedFiles,
        fileChanges,
        suggestedFollowUps: [
          'Make another change',
          'Preview the updated version',
          'Save this as a new version',
          'Deploy the updated site'
        ],
        providerName: this.name,
        isSimulated: false
      };
    } catch (error: any) {
      throw new Error(`Gemini refinement failed: ${error.message}`);
    }
  }

  private extractContentManually(raw: string, prompt: string): any {
    // Fallback: build a basic site if JSON extraction failed
    return {
      title: prompt,
      brandName: prompt,
      summary: `Generated website for: ${prompt}`,
      reasoning: 'Built based on your prompt',
      html: this.buildFallbackHTML(prompt, {}),
      css: '',
      js: ''
    };
  }

  private buildFallbackHTML(prompt: string, data: any): string {
    const title = data.title || prompt;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-800">
  <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
    <h1 class="text-xl font-bold text-slate-900">${title}</h1>
    <nav class="flex gap-6 text-sm font-medium text-slate-600">
      <a href="#" class="hover:text-indigo-600">Home</a>
      <a href="#about" class="hover:text-indigo-600">About</a>
      <a href="#contact" class="hover:text-indigo-600">Contact</a>
    </nav>
  </header>
  <main>
    <section class="max-w-4xl mx-auto px-6 py-20 text-center">
      <h2 class="text-5xl font-extrabold text-slate-900 mb-6">${prompt}</h2>
      <p class="text-xl text-slate-600 mb-10">Generated by DeployX AI. Customize this site using the chat.</p>
      <button class="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
        Get Started
      </button>
    </section>
  </main>
  <footer class="text-center py-8 text-sm text-slate-500 border-t border-slate-200">
    © 2026 ${title} · Built with DeployX
  </footer>
</body>
</html>`;
  }
}
