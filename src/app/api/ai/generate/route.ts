import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/adapter';
import { CodeSecurityValidator } from '@/lib/ai/validator';
import { ProjectStore } from '@/lib/store';
import { GenerationRequest, ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body: GenerationRequest = await req.json();
    const { projectId, prompt, clarifications, visualConfig } = body;

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'Missing projectId or prompt' }, { status: 400 });
    }

    const project = ProjectStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const provider = AIProviderFactory.getProvider(project.aiProvider);
    const result = await provider.generate({
      projectId,
      prompt,
      clarifications,
      visualConfig: visualConfig || project.visualConfig
    });

    // Validate security of generated files
    const validation = CodeSecurityValidator.validateGeneratedFiles(result.files);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Generated files failed security validation',
        details: validation.errors
      }, { status: 422 });
    }

    // Apply sanitized files to project
    project.files = validation.sanitized;
    project.status = 'ready';

    // Add user message and assistant message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: prompt,
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

    project.messages.push(userMsg, assistantMsg);

    // Save project and version snapshot
    ProjectStore.saveProject(project);
    ProjectStore.addVersionSnapshot(projectId, `Generated: "${prompt.slice(0, 50)}..."`, 'DeployX AI');

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        files: validation.sanitized
      },
      project
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
