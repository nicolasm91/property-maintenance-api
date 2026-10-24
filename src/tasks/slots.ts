// Platform time zone is America/Argentina/Buenos_Aires. Argentina has had no
// daylight saving time since 2009, so a fixed offset is enough.
const UTC_OFFSET_MINUTES = -3 * 60;
const UTC_OFFSET = '-03:00';

const SLOT_MINUTES = 30;
const FIRST_SLOT_MINUTE = 7 * 60;
const LAST_SLOT_MINUTE = 18 * 60 + 30;
const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

export const SLOTS_PER_DAY = (LAST_SLOT_MINUTE - FIRST_SLOT_MINUTE) / SLOT_MINUTES + 1;

export function isSlotStart(date: Date): boolean {
  if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
    return false;
  }
  const utcMinute = date.getUTCHours() * 60 + date.getUTCMinutes();
  const localMinute = (utcMinute + UTC_OFFSET_MINUTES + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return localMinute % SLOT_MINUTES === 0 && localMinute >= FIRST_SLOT_MINUTE && localMinute <= LAST_SLOT_MINUTE;
}

export function isFutureSlotStart(date: Date, now: Date = new Date()): boolean {
  return isSlotStart(date) && date.getTime() > now.getTime();
}

// `day` is a YYYY-MM-DD date in the platform time zone; the slots are returned in UTC.
export function slotsOn(day: string): Date[] {
  const firstSlot = new Date(`${day}T07:00:00${UTC_OFFSET}`);
  // Date rolls impossible days over (2026-02-30 becomes March 2), so the day must round-trip.
  const localDay = Number.isNaN(firstSlot.getTime())
    ? null
    : new Date(firstSlot.getTime() + UTC_OFFSET_MINUTES * MS_PER_MINUTE).toISOString().slice(0, 10);
  if (localDay !== day) {
    throw new RangeError(`Invalid day: ${day}`);
  }
  return Array.from(
    { length: SLOTS_PER_DAY },
    (_, i) => new Date(firstSlot.getTime() + i * SLOT_MINUTES * MS_PER_MINUTE),
  );
}
