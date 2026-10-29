import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { ProjectStore } from '@/lib/store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = ProjectStore.getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const zip = new JSZip();

  // Add all project files into zip
  for (const file of project.files) {
    zip.file(file.path, file.content);
  }

  // Add deployx metadata manifest
  zip.file('deployx.json', JSON.stringify({
    id: project.id,
    name: project.name,
    description: project.description,
    exportedAt: new Date().toISOString(),
    version: project.versions.length,
    activeIntegrations: {
      bookings: project.bookingConfig.enabled,
      otp: project.otpConfig.enabled,
      payments: project.paymentConfig.enabled
    }
  }, null, 2));

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-deployx.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
