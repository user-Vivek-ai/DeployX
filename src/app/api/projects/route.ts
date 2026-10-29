import { NextResponse } from 'next/server';
import { ProjectStore } from '@/lib/store';

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
      description,
      initialPrompt,
      tags,
      aiProvider
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
