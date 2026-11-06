/**
 * Domain tests for the pure rule, called directly (no UI).
 * Fixed demo clock: now = 540 (09:00); one existing booking 600-660.
 */
import { describe, expect, it } from 'vitest';
import { checkAvailability, formatTime, type RoomState } from './availability';
import { DEMO_ROOM } from '../data/demoRoom';

const room = (overrides: Partial<RoomState> = {}): RoomState => ({
  now: 540,
  blocked: false,
  bookings: [{ start: 600, end: 660 }],
  ...overrides,
});

describe('checkAvailability (domain)', () => {
  it('D01 AC1 past time is rejected', () => {
    expect(checkAvailability(room(), 500, 560)).toEqual({
      available: false,
      message: 'Start must be later than the current time (540 min = 09:00).',
    });
  });

  it('D02 AC1 start exactly at now is rejected', () => {
    expect(checkAvailability(room(), 540, 560).available).toBe(false);
  });

  it('D03 AC1 reversed and zero-length intervals are rejected with distinct messages', () => {
    expect(checkAvailability(room(), 720, 700).message).toBe(
      'Start must be earlier than end (reversed times are not allowed).',
    );
    expect(checkAvailability(room(), 700, 700).message).toBe('Start and end must be different times.');
  });

  it('D04 AC1 non-integer / null input and out-of-day times are rejected', () => {
    expect(checkAvailability(room(), null, 700).message).toBe(
      'Start and end must be whole-number minutes (integers).',
    );
    expect(checkAvailability(room(), 700, 700.5).message).toBe(
      'Start and end must be whole-number minutes (integers).',
    );
    expect(checkAvailability(room(), 1400, 1441).message).toBe(
      'Times must be within the same day: 0 to 1440 minutes.',
    );
  });

  it('D05 AC2 121 minutes is rejected, exactly 120 is allowed', () => {
    expect(checkAvailability(room(), 700, 821).message).toBe(
      'Maximum booking length is 120 minutes; this request is 121 minutes.',
    );
    expect(checkAvailability(room(), 700, 820).available).toBe(true);
  });

  it('D06 AC3 blocked room is rejected', () => {
    expect(checkAvailability(room({ blocked: true }), 700, 760)).toEqual({
      available: false,
      message: 'Room B-204 is blocked (demo) and cannot be used.',
    });
  });

  it('D07 AC4 overlap is rejected; touching either endpoint is allowed', () => {
    expect(checkAvailability(room(), 630, 690).message).toBe(
      'Overlaps an existing booking (600–660 min = 10:00–11:00).',
    );
    expect(checkAvailability(room(), 660, 720).available).toBe(true);
    expect(checkAvailability(room(), 550, 600).available).toBe(true);
  });

  it('D08 check order: duration is reported before blocked, blocked before overlap', () => {
    expect(checkAvailability(room({ blocked: true }), 600, 721).message).toMatch(/^Maximum booking length/);
    expect(checkAvailability(room({ blocked: true }), 630, 690).message).toBe(
      'Room B-204 is blocked (demo) and cannot be used.',
    );
  });

  it('D09 AC5 does not mutate input and repeated checks give the same answer', () => {
    const r = room();
    const snapshot = structuredClone(r);
    const first = checkAvailability(r, 630, 690);
    const second = checkAvailability(r, 630, 690);
    expect(second).toEqual(first);
    expect(r).toEqual(snapshot);
  });
});

describe('formatTime', () => {
  it('F01 formats minutes as HH:MM including 24:00', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(540)).toBe('09:00');
    expect(formatTime(665)).toBe('11:05');
    expect(formatTime(1440)).toBe('24:00');
  });
});

describe('DEMO_ROOM fixture', () => {
  it('X01 keeps the documented demo values', () => {
    expect(DEMO_ROOM).toEqual({ now: 540, blocked: false, bookings: [{ start: 600, end: 660 }] });
  });
});
