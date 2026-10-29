import { NextResponse } from 'next/server';
import { BookingsService } from '@/lib/integrations/bookings-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, customerName, customerEmail, customerPhone, serviceName, date, timeSlot, partySize, notes } = body;

    if (!projectId || !customerName || !customerEmail || !date || !timeSlot) {
      return NextResponse.json({
        error: 'Missing essential booking parameters (name, email, date, timeSlot)'
      }, { status: 400 });
    }

    const result = BookingsService.createBooking(projectId, {
      projectId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      serviceName: serviceName || 'Standard Reservation',
      date,
      timeSlot,
      partySize: Number(partySize) || 2,
      notes: notes || ''
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: 'Booking confirmed successfully.'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Booking creation failed' }, { status: 500 });
  }
}
