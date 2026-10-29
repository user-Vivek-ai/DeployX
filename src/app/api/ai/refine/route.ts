import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/adapter';
import { CodeSecurityValidator } from '@/lib/ai/validator';
import { ProjectStore } from '@/lib/store';
import { ProjectFile, ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { projectId, prompt } = await req.json();

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'Missing projectId or prompt' }, { status: 400 });
    }

    const project = ProjectStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const provider = AIProviderFactory.getProvider(project.aiProvider);
    const result = await provider.refine(prompt, project.files, {
      projectId,
      prompt,
      currentFiles: project.files,
      visualConfig: project.visualConfig
    });

    const validation = CodeSecurityValidator.validateGeneratedFiles(result.files);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Refined files failed security checks',
        details: validation.errors
      }, { status: 422 });
    }

    // Auto-save snapshot of current version before applying modification
    ProjectStore.addVersionSnapshot(projectId, `Before edit: "${prompt.slice(0, 40)}"`, 'User Edit');

    // Update project state
    project.files = validation.sanitized;

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
    ProjectStore.saveProject(project);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        files: validation.sanitized
      },
      project
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Refinement failed' }, { status: 500 });
  }
}
