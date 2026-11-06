// Pure booking rule for room availability (AC1-AC5). No React, no I/O, no mutation.

export type Booking = { start: number; end: number };
export type RoomState = { now: number; blocked: boolean; bookings: Booking[] };
export type Result = { available: boolean; message: string };

export const MAX_MINUTES = 120;
const DAY_MINUTES = 1440;

function isWholeMinute(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

function overlaps(start: number, end: number, booking: Booking): boolean {
  return start < booking.end && end > booking.start;
}

export function checkAvailability(room: RoomState, start: number | null, end: number | null): Result {
  if (!isWholeMinute(start) || !isWholeMinute(end)) {
    return { available: false, message: 'Start and end must be whole-number minutes (integers).' };
  }
  if (start < 0 || end > DAY_MINUTES) {
    return { available: false, message: 'Times must be within the same day: 0 to 1440 minutes.' };
  }
  if (start >= end) {
    return start === end
      ? { available: false, message: 'Start and end must be different times.' }
      : { available: false, message: 'Start must be earlier than end (reversed times are not allowed).' };
  }
  if (start <= room.now) {
    return {
      available: false,
      message: `Start must be later than the current time (${room.now} min = ${formatTime(room.now)}).`,
    };
  }
  const duration = end - start;
  if (duration > MAX_MINUTES) {
    return {
      available: false,
      message: `Maximum booking length is ${MAX_MINUTES} minutes; this request is ${duration} minutes.`,
    };
  }
  if (room.blocked) {
    return { available: false, message: 'Room B-204 is blocked (demo) and cannot be used.' };
  }
  for (const booking of room.bookings) {
    if (overlaps(start, end, booking)) {
      return {
        available: false,
        message: `Overlaps an existing booking (${booking.start}–${booking.end} min = ${formatTime(booking.start)}–${formatTime(booking.end)}).`,
      };
    }
  }
  return { available: true, message: 'Room B-204 is available for this time.' };
}

export function formatTime(minutes: number): string {
  if (minutes === DAY_MINUTES) return '24:00';
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
