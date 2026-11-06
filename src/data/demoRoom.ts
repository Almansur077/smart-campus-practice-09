// Fictional demo fixture for room B-204. Treat as read-only; App copies it into state.
import type { RoomState } from '../domain/availability';

export const DEMO_ROOM: RoomState = {
  now: 540,
  blocked: false,
  bookings: [{ start: 600, end: 660 }],
};
