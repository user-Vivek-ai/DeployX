import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/adapter';
import { CodeSecurityValidator } from '@/lib/ai/validator';
import { isWebsiteIntent } from '@/lib/ai/intent';
import { ProjectStore } from '@/lib/store';
import { ProjectFile, ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { projectId, prompt, currentFiles } = await req.json();

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'Missing projectId or prompt' }, { status: 400 });
    }

    let project = ProjectStore.getProject(projectId);
    if (!project) {
      project = ProjectStore.createProject({
        name: prompt.slice(0, 36) || 'Chat Session',
        description: prompt,
        initialPrompt: prompt
      });
      project.id = projectId;
      if (currentFiles && Array.isArray(currentFiles)) {
        project.files = currentFiles;
      }
      ProjectStore.saveProject(project);
    } else if (currentFiles && Array.isArray(currentFiles) && currentFiles.length > 0 && project.files.length === 0) {
      project.files = currentFiles;
    }

    const provider = AIProviderFactory.getProvider(project.aiProvider || 'auto');
    const hasFiles = project.files.some(f => f.path === 'index.html' || f.path.endsWith('.html'));
    const isWeb = isWebsiteIntent(prompt, hasFiles);

    // If intent is purely conversational / ChatGPT time pass
    if (!isWeb) {
      const reply = await provider.chat(prompt);

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      };

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: reply,
        providerUsed: provider.name,
        timestamp: new Date().toISOString()
      };

      project.messages.push(userMsg, assistantMsg);
      ProjectStore.saveProject(project);

      return NextResponse.json({
        success: true,
        project,
        isChat: true
      });
    }

    // Website generation or modification
    let result;
    if (!hasFiles || project.files.length === 0) {
      result = await provider.generate({
        projectId,
        prompt,
        visualConfig: project.visualConfig
      });
    } else {
      result = await provider.refine(prompt, project.files, {
        projectId,
        prompt,
        currentFiles: project.files,
        visualConfig: project.visualConfig
      });
    }

    const validation = CodeSecurityValidator.validateGeneratedFiles(result.files);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Refined files failed security checks',
        details: validation.errors
      }, { status: 422 });
    }

    // Auto-save snapshot of current version before applying modification
    ProjectStore.addVersionSnapshot(projectId, `Edit: "${prompt.slice(0, 40)}"`, 'User Edit');

    // Update project state
    project.files = validation.sanitized;
    project.status = 'ready';

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
