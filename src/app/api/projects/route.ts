import { NextResponse } from 'next/server';
import { ProjectStore } from '@/lib/store';
import { AIProviderFactory } from '@/lib/ai/adapter';
import { CodeSecurityValidator } from '@/lib/ai/validator';
import { ChatMessage } from '@/lib/types';

export async function GET() {
  const projects = ProjectStore.getAllProjects();
  return NextResponse.json({ success: true, projects });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, initialPrompt, tags, aiProvider } = body;

    const project = ProjectStore.createProject({
      name,
      description: description || initialPrompt,
      initialPrompt,
      tags,
      aiProvider
    });

    // If an initialPrompt is provided, synthesize the website immediately in this call!
    if (initialPrompt && initialPrompt.trim()) {
      try {
        const provider = AIProviderFactory.getProvider('auto');
        const result = await provider.generate({
          projectId: project.id,
          prompt: initialPrompt.trim(),
          visualConfig: project.visualConfig
        });

        const validation = CodeSecurityValidator.validateGeneratedFiles(result.files);
        if (validation.valid && validation.sanitized.length > 0) {
          project.files = validation.sanitized;
          project.status = 'ready';

          const userMsg: ChatMessage = {
            id: `msg_${Date.now()}_u`,
            role: 'user',
            content: initialPrompt,
            timestamp: new Date().toISOString()
          };

          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now()}_a`,
            role: 'assistant',
            content: result.summary,
            reasoning: result.reasoning,
            fileChanges: result.fileChanges,
            suggestedActions: result.suggestedFollowUps,
            providerUsed: result.providerName,
            isSimulated: result.isSimulated,
            timestamp: new Date().toISOString()
          };

          project.messages = [userMsg, assistantMsg];
          ProjectStore.saveProject(project);
          ProjectStore.addVersionSnapshot(project.id, `Initial: "${initialPrompt.slice(0, 40)}"`, 'Gemini AI');
        }
      } catch (genErr) {
        console.error('Error generating initial files:', genErr);
      }
    }

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
