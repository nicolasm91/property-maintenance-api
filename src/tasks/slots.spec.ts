import { isFutureSlotStart, isSlotStart, SLOTS_PER_DAY, slotsOn } from './slots.js';

describe('isSlotStart', () => {
  it.each([
    ['the first slot (07:00)', '2026-11-02T07:00:00-03:00'],
    ['a half-hour slot', '2026-11-02T12:30:00-03:00'],
    ['the last slot (18:30)', '2026-11-02T18:30:00-03:00'],
  ])('accepts %s', (_, iso) => {
    expect(isSlotStart(new Date(iso))).toBe(true);
  });

  it.each([
    ['before the first slot (06:30)', '2026-11-02T06:30:00-03:00'],
    ['the end of the last slot (19:00)', '2026-11-02T19:00:00-03:00'],
    ['a minute that is not :00 or :30', '2026-11-02T10:15:00-03:00'],
    ['non-zero seconds', '2026-11-02T10:00:01-03:00'],
    ['non-zero milliseconds', '2026-11-02T10:00:00.001-03:00'],
    ['midnight', '2026-11-02T00:00:00-03:00'],
  ])('rejects %s', (_, iso) => {
    expect(isSlotStart(new Date(iso))).toBe(false);
  });

  it('uses the platform time zone, not UTC', () => {
    // 07:00 UTC is 04:00 in Buenos Aires; 21:30 UTC is 18:30 there.
    expect(isSlotStart(new Date('2026-11-02T07:00:00Z'))).toBe(false);
    expect(isSlotStart(new Date('2026-11-02T21:30:00Z'))).toBe(true);
  });
});

describe('isFutureSlotStart', () => {
  const now = new Date('2026-11-02T10:10:00-03:00');

  it('accepts a later slot', () => {
    expect(isFutureSlotStart(new Date('2026-11-02T10:30:00-03:00'), now)).toBe(true);
  });

  it('rejects a past slot', () => {
    expect(isFutureSlotStart(new Date('2026-11-02T10:00:00-03:00'), now)).toBe(false);
  });

  it('rejects a slot starting right now', () => {
    const slot = new Date('2026-11-02T10:30:00-03:00');
    expect(isFutureSlotStart(slot, slot)).toBe(false);
  });

  it('rejects a future time that is not a slot start', () => {
    expect(isFutureSlotStart(new Date('2026-11-02T20:00:00-03:00'), now)).toBe(false);
  });
});

describe('slotsOn', () => {
  it('returns every slot of the day, from 07:00 to 18:30 local time, in UTC', () => {
    const slots = slotsOn('2026-11-02');

    expect(SLOTS_PER_DAY).toBe(24);
    expect(slots).toHaveLength(24);
    expect(slots[0].toISOString()).toBe('2026-11-02T10:00:00.000Z');
    expect(slots[1].toISOString()).toBe('2026-11-02T10:30:00.000Z');
    expect(slots[23].toISOString()).toBe('2026-11-02T21:30:00.000Z');
    expect(slots.every((slot) => isSlotStart(slot))).toBe(true);
  });

  it.each(['2026-13-01', '2026-02-30', '2026-11-2', '2026-11-02T00:00', 'tomorrow', ''])(
    'rejects the invalid day %j',
    (day) => {
      expect(() => slotsOn(day)).toThrow(RangeError);
    },
  );
});
