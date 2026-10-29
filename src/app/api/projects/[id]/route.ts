import { NextResponse } from 'next/server';
import { ProjectStore } from '@/lib/store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = ProjectStore.getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, project });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = ProjectStore.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updates = await req.json();

    if (updates.name) project.name = updates.name;
    if (updates.description) project.description = updates.description;
    if (updates.files) project.files = updates.files;
    if (updates.visualConfig) project.visualConfig = { ...project.visualConfig, ...updates.visualConfig };
    if (updates.bookingConfig) project.bookingConfig = { ...project.bookingConfig, ...updates.bookingConfig };
    if (updates.otpConfig) project.otpConfig = { ...project.otpConfig, ...updates.otpConfig };
    if (updates.paymentConfig) project.paymentConfig = { ...project.paymentConfig, ...updates.paymentConfig };
    if (updates.aiProvider) project.aiProvider = updates.aiProvider;

    ProjectStore.saveProject(project);

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const deleted = ProjectStore.deleteProject(params.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Project not found or already deleted' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Project removed successfully' });
}
