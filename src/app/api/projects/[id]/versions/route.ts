import { NextResponse } from 'next/server';
import { ProjectStore } from '@/lib/store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = ProjectStore.getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, versions: project.versions || [] });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { message, author } = await req.json();
    const snapshot = ProjectStore.addVersionSnapshot(params.id, message || 'Manual Snapshot', author || 'User');
    if (!snapshot) {
      return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 400 });
    }
    return NextResponse.json({ success: true, snapshot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Snapshot failed' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { versionId } = await req.json();
    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const restored = ProjectStore.restoreVersion(params.id, versionId);
    if (!restored) {
      return NextResponse.json({ error: 'Target version not found' }, { status: 404 });
    }

    const updatedProject = ProjectStore.getProject(params.id);
    return NextResponse.json({
      success: true,
      message: `Successfully reverted project to version ${versionId}`,
      project: updatedProject
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Restore failed' }, { status: 500 });
  }
}
