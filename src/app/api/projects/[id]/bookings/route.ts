import { NextResponse } from 'next/server';
import { BookingsService } from '@/lib/integrations/bookings-service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const bookings = BookingsService.getBookingsForProject(params.id);
  return NextResponse.json({ success: true, bookings });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { bookingId, status } = await req.json();
    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 });
    }

    const updated = BookingsService.updateStatus(params.id, bookingId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Booking marked as ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required for privacy removal' }, { status: 400 });
    }

    const { removedCount } = BookingsService.deleteCustomerData(params.id, email);
    return NextResponse.json({
      success: true,
      message: `Privacy action complete. Removed ${removedCount} record(s) for ${email}.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}
