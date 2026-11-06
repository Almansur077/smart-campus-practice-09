/**
 * UI regression (characterization) tests.
 *
 * Written BEFORE the Practice #09 refactor and run unchanged before and after it.
 * They drive the real <App /> through the form, so they only depend on
 * visible behaviour (AC1-AC6), not on how the code is organised.
 * Fixed demo clock: now = 540 (09:00); one existing booking 600-660.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';

afterEach(cleanup);

function check(start: string, end: string, blocked = false) {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Start (minutes after midnight)'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('End (minutes after midnight)'), { target: { value: end } });
  const box = screen.getByLabelText('Room blocked (demo)') as HTMLInputElement;
  if (box.checked !== blocked) fireEvent.click(box);
  fireEvent.click(screen.getByRole('button', { name: 'Check availability' }));
  return screen.getByRole('status').textContent ?? '';
}

describe('UI regression: AC1-AC6 through the form', () => {
  it('U01 AC1 past time (start before now=540) is rejected', () => {
    expect(check('500', '560')).toBe(
      'UnavailableStart must be later than the current time (540 min = 09:00).',
    );
  });

  it('U02 AC1 start exactly at now is rejected', () => {
    expect(check('540', '570')).toMatch(/^UnavailableStart must be later than the current time/);
  });

  it('U03 AC1 reversed interval is rejected', () => {
    expect(check('720', '700')).toBe(
      'UnavailableStart must be earlier than end (reversed times are not allowed).',
    );
  });

  it('U04 AC1 zero-length interval is rejected', () => {
    expect(check('700', '700')).toBe('UnavailableStart and end must be different times.');
  });

  it('U05 AC2 121-minute duration is rejected', () => {
    expect(check('720', '841')).toBe(
      'UnavailableMaximum booking length is 120 minutes; this request is 121 minutes.',
    );
  });

  it('U06 AC2 exactly 120 minutes is allowed', () => {
    expect(check('720', '840')).toBe('AvailableRoom B-204 is available for this time.');
  });

  it('U07 AC3 blocked room is rejected', () => {
    expect(check('660', '720', true)).toBe('UnavailableRoom B-204 is blocked (demo) and cannot be used.');
  });

  it('U08 AC4 overlap is rejected', () => {
    expect(check('630', '690')).toBe(
      'UnavailableOverlaps an existing booking (600–660 min = 10:00–11:00).',
    );
  });

  it('U09 AC4 touching the end of a booking (660-720) is allowed', () => {
    expect(check('660', '720')).toBe('AvailableRoom B-204 is available for this time.');
  });

  it('U10 AC4 touching the start of a booking (550-600) is allowed', () => {
    expect(check('550', '600')).toBe('AvailableRoom B-204 is available for this time.');
  });

  it('U11 AC1 outside the day (end 1441) is rejected', () => {
    expect(check('1400', '1441')).toBe('UnavailableTimes must be within the same day: 0 to 1440 minutes.');
  });

  it('U12 AC6 empty start gives a clear message', () => {
    expect(check('', '720')).toBe('UnavailableStart is required.');
  });

  it('U13 AC5 checking twice gives the same answer and the booking list is unchanged', () => {
    render(<App />);
    const before = screen.getByText(/600–660/).textContent;
    const button = screen.getByRole('button', { name: 'Check availability' });
    fireEvent.click(button);
    const first = screen.getByRole('status').textContent;
    fireEvent.click(button);
    const second = screen.getByRole('status').textContent;
    expect(first).toBe('AvailableRoom B-204 is available for this time.');
    expect(second).toBe(first);
    expect(screen.getByText(/600–660/).textContent).toBe(before);
    expect(before).toBe('600–660 (10:00–11:00)');
  });
});
