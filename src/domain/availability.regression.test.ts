/**
 * Focused regression tests (Step 6) for the pure rule, run against the real DEMO_ROOM fixture.
 * They add boundary and check-order cases on top of D01-D09 / U01-U13; nothing there is changed.
 * Fixed demo clock: now = 540 (09:00); one existing booking 600-660 (10:00-11:00).
 */
import { describe, expect, it } from 'vitest';
import { checkAvailability, type RoomState } from './availability';
import { DEMO_ROOM } from '../data/demoRoom';

const AVAILABLE = { available: true, message: 'Room B-204 is available for this time.' };
const PAST = { available: false, message: 'Start must be later than the current time (540 min = 09:00).' };
const REVERSED = { available: false, message: 'Start must be earlier than end (reversed times are not allowed).' };
const BLOCKED = { available: false, message: 'Room B-204 is blocked (demo) and cannot be used.' };
const OVERLAP = { available: false, message: 'Overlaps an existing booking (600–660 min = 10:00–11:00).' };
const tooLong = (minutes: number) => ({
  available: false,
  message: `Maximum booking length is 120 minutes; this request is ${minutes} minutes.`,
});

/** Deep-frozen copy: any write attempt by the rule throws in ESM strict mode. */
function frozenRoom(overrides: Partial<RoomState> = {}): RoomState {
  const copy: RoomState = structuredClone({ ...DEMO_ROOM, ...overrides });
  copy.bookings.forEach((b) => Object.freeze(b));
  Object.freeze(copy.bookings);
  return Object.freeze(copy);
}

describe('Regression: AC1-AC5 boundaries on the demo fixture', () => {
  it('R01 AC1 past time: one minute before now and fully past intervals are rejected; now+1 is allowed', () => {
    expect(checkAvailability(frozenRoom(), 539, 560)).toEqual(PAST);
    expect(checkAvailability(frozenRoom(), 0, 60)).toEqual(PAST);
    expect(checkAvailability(frozenRoom(), 541, 600)).toEqual(AVAILABLE);
  });

  it('R02 AC1 reversed interval is rejected, and reported before the past-time check', () => {
    expect(checkAvailability(frozenRoom(), 841, 720)).toEqual(REVERSED);
    expect(checkAvailability(frozenRoom(), 500, 400)).toEqual(REVERSED);
  });

  it('R03 AC2 121 minutes is rejected with the exact duration; 120 is allowed', () => {
    expect(checkAvailability(frozenRoom(), 720, 841)).toEqual(tooLong(121));
    expect(checkAvailability(frozenRoom(), 1319, 1440)).toEqual(tooLong(121));
    expect(checkAvailability(frozenRoom(), 720, 840)).toEqual(AVAILABLE);
    expect(checkAvailability(frozenRoom(), 1320, 1440)).toEqual(AVAILABLE);
  });

  it('R04 AC2 121 minutes that also overlaps a booking reports the duration, not the overlap', () => {
    expect(checkAvailability(frozenRoom(), 600, 721)).toEqual(tooLong(121));
  });

  it('R05 AC3 blocked room rejects an otherwise valid free slot, a 120-minute slot and an overlapping slot', () => {
    const blocked = frozenRoom({ blocked: true });
    expect(checkAvailability(blocked, 660, 720)).toEqual(BLOCKED);
    expect(checkAvailability(blocked, 720, 840)).toEqual(BLOCKED);
    expect(checkAvailability(blocked, 630, 690)).toEqual(BLOCKED);
  });

  it('R06 AC4 overlap: partial at either edge, inside, covering and identical intervals are rejected', () => {
    expect(checkAvailability(frozenRoom(), 541, 601)).toEqual(OVERLAP);
    expect(checkAvailability(frozenRoom(), 659, 720)).toEqual(OVERLAP);
    expect(checkAvailability(frozenRoom(), 610, 650)).toEqual(OVERLAP);
    expect(checkAvailability(frozenRoom(), 590, 670)).toEqual(OVERLAP);
    expect(checkAvailability(frozenRoom(), 600, 660)).toEqual(OVERLAP);
  });

  it('R07 AC4 touching endpoints [start, end) is allowed, including a slot that exactly fills a gap', () => {
    expect(checkAvailability(frozenRoom(), 660, 720)).toEqual(AVAILABLE);
    expect(checkAvailability(frozenRoom(), 550, 600)).toEqual(AVAILABLE);
    const twoBookings = frozenRoom({
      bookings: [
        { start: 600, end: 660 },
        { start: 720, end: 780 },
      ],
    });
    expect(checkAvailability(twoBookings, 660, 720)).toEqual(AVAILABLE);
  });

  it('R08 AC5 fixtures are unchanged: frozen input never throws, DEMO_ROOM is identical after every case', () => {
    const snapshot = structuredClone(DEMO_ROOM);
    const bookingsRef = DEMO_ROOM.bookings;
    const cases: Array<[number, number, boolean]> = [
      [500, 560, false],
      [720, 700, false],
      [720, 841, false],
      [660, 720, true],
      [630, 690, false],
      [660, 720, false],
      [550, 600, false],
    ];
    for (const [start, end, blocked] of cases) {
      const frozen = frozenRoom({ blocked });
      const first = checkAvailability(frozen, start, end);
      expect(checkAvailability(frozen, start, end)).toEqual(first);
      const onFixture = checkAvailability({ ...DEMO_ROOM, blocked }, start, end);
      expect(onFixture).toEqual(first);
    }
    expect(DEMO_ROOM).toEqual(snapshot);
    expect(DEMO_ROOM.bookings).toBe(bookingsRef);
    expect(DEMO_ROOM.bookings).toHaveLength(1);
  });
});
