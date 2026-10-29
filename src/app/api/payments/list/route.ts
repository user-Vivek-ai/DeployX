import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/integrations/payment-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const payments = PaymentService.getIntentsForProject(projectId);
  return NextResponse.json({ success: true, payments });
}
