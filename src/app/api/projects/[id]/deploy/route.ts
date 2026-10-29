import { NextResponse } from 'next/server';
import { ProjectStore } from '@/lib/store';
import { Deployment, DeploymentLog } from '@/lib/types';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = ProjectStore.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { environment = 'production' } = await req.json().catch(() => ({}));

    if (!project.files || project.files.length === 0) {
      return NextResponse.json({
        error: 'Cannot deploy an empty project. Please generate files first.'
      }, { status: 400 });
    }

    const deployId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const commitHash = Math.random().toString(36).substring(2, 9);
    const slug = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const deploymentUrl = `https://${slug}.deployx.preview`;

    const nowStr = new Date().toTimeString().split(' ')[0];

    const logs: DeploymentLog[] = [
      {
        timestamp: nowStr,
        level: 'info',
        step: 'init',
        message: `Triggering deployment for environment [${environment}] on commit ${commitHash}`
      },
      {
        timestamp: nowStr,
        level: 'info',
        step: 'validate',
        message: `Validating project tree (${project.files.length} files: ${project.files.map(f => f.path).join(', ')})`
      },
      {
        timestamp: nowStr,
        level: 'info',
        step: 'build',
        message: 'Compiling virtual sandboxed assets, verifying Tailwind styles and script hooks'
      },
      {
        timestamp: nowStr,
        level: 'info',
        step: 'optimize',
        message: 'Generating edge cache headers & TLS certificates for preview domain'
      },
      {
        timestamp: nowStr,
        level: 'success',
        step: 'deploy',
        message: `Deployment succeeded! Available at ${deploymentUrl} (Local Sandbox Simulation)`
      }
    ];

    const deployment: Deployment = {
      id: deployId,
      projectId: project.id,
      environment,
      status: 'succeeded',
      logs,
      url: deploymentUrl,
      commitHash,
      createdAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 2000).toISOString(),
      isSimulation: true,
      versionNumber: project.versions.length || 1
    };

    project.deployments.unshift(deployment);
    project.status = 'deployed';
    project.activeDeploymentUrl = deploymentUrl;

    ProjectStore.saveProject(project);

    return NextResponse.json({
      success: true,
      deployment,
      project
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Deployment failed' }, { status: 500 });
  }
}
