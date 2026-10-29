import { Booking, BookingConfig } from '../types';

export class BookingsService {
  private static bookings: Map<string, Booking[]> = new Map();

  /**
   * Initializes default sample bookings for demo purposes
   */
  public static getBookingsForProject(projectId: string): Booking[] {
    if (!this.bookings.has(projectId)) {
      // Seed with initial realistic sample bookings
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const initialBookings: Booking[] = [
        {
          id: 'bkg_01',
          projectId,
          customerName: 'Elena Rostova',
          customerEmail: 'elena.rostova@example.com',
          customerPhone: '+1 (555) 234-5678',
          serviceName: 'Chef Table Tasting',
          date: dateStr,
          timeSlot: '19:30',
          partySize: 4,
          notes: 'Anniversary celebration. Window seating preferred.',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'bkg_02',
          projectId,
          customerName: 'David Chen',
          customerEmail: 'david.chen@enterprise.io',
          customerPhone: '+1 (555) 876-5432',
          serviceName: 'Standard Dining',
          date: dateStr,
          timeSlot: '18:00',
          partySize: 2,
          notes: 'Gluten-free menu inquiry.',
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ];
      this.bookings.set(projectId, initialBookings);
    }

    return this.bookings.get(projectId) || [];
  }

  /**
   * Adds a new booking with conflict detection
   */
  public static createBooking(projectId: string, data: Omit<Booking, 'id' | 'createdAt' | 'status'>): {
    success: boolean;
    booking?: Booking;
    error?: string;
  } {
    const list = this.getBookingsForProject(projectId);

    // Prevent duplicate bookings at same date and slot by same email
    const duplicate = list.find(b =>
      b.date === data.date &&
      b.timeSlot === data.timeSlot &&
      b.customerEmail.toLowerCase() === data.customerEmail.toLowerCase() &&
      b.status !== 'cancelled'
    );

    if (duplicate) {
      return {
        success: false,
        error: `A booking already exists for ${data.customerEmail} at ${data.timeSlot} on ${data.date}.`
      };
    }

    // Capacity limit check
    const sameSlotCount = list.filter(b => b.date === data.date && b.timeSlot === data.timeSlot && b.status !== 'cancelled').length;
    if (sameSlotCount >= 6) {
      return {
        success: false,
        error: `Time slot ${data.timeSlot} on ${data.date} has reached full capacity. Please choose another time.`
      };
    }

    const newBooking: Booking = {
      ...data,
      id: `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    list.unshift(newBooking);
    this.bookings.set(projectId, list);

    return {
      success: true,
      booking: newBooking
    };
  }

  /**
   * Updates booking status
   */
  public static updateStatus(projectId: string, bookingId: string, status: Booking['status']): boolean {
    const list = this.getBookingsForProject(projectId);
    const item = list.find(b => b.id === bookingId);
    if (item) {
      item.status = status;
      return true;
    }
    return false;
  }

  /**
   * GDPR / Right to be forgotten: removes customer PII
   */
  public static deleteCustomerData(projectId: string, email: string): { removedCount: number } {
    const list = this.getBookingsForProject(projectId);
    const before = list.length;
    const filtered = list.filter(b => b.customerEmail.toLowerCase() !== email.toLowerCase());
    this.bookings.set(projectId, filtered);
    return { removedCount: before - filtered.length };
  }
}
