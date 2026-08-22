// FILE: settings/personal/timezone-helpers.ts
// Timezone list and clock formatting for the personal-settings page. Pure — no
// React, no I/O.
//
// THE LIST COMES FROM THE BROWSER, not from a bundled array. Intl.supportedValuesOf
// is the same authority the server validates against, so the dropdown physically
// cannot offer a zone the PATCH will reject. A hand-kept list would drift the moment
// the tz database changes.

/** Zones lifted to the top of the dropdown. India first — that is who hires here. */
const PINNED_ZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

/** Every zone this browser knows. Empty array on a browser without the API. */
function allZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
}

export interface TimezoneGroup { label: string; zones: string[] }

/**
 * The dropdown's contents: a short pinned group, then everything else.
 *
 * `current` is always present somewhere, even if the browser does not list it —
 * otherwise a <select> whose value is unknown renders blank, and the user's saved
 * timezone would look like it had been lost.
 */
export function buildTimezoneGroups(current: string): TimezoneGroup[] {
  const zones = allZones();
  const pinned = PINNED_ZONES.filter((zone) => zones.length === 0 || zones.includes(zone));
  if (current && !pinned.includes(current) && !zones.includes(current)) pinned.push(current);

  const rest = zones.filter((zone) => !pinned.includes(zone));
  const groups: TimezoneGroup[] = [{ label: 'Common', zones: pinned }];
  if (rest.length > 0) groups.push({ label: 'All timezones', zones: rest });
  return groups;
}

/** "Asia/Kolkata" → "Asia / Kolkata" — readable without losing the exact id. */
export function formatZoneLabel(zone: string): string {
  return zone.replace(/_/g, ' ').replace('/', ' / ');
}

/**
 * "3:45 PM IST" in the given zone, or null when the zone is unusable.
 *
 * The abbreviation matters more than it looks: "3:45 PM" alone gives the user no way
 * to tell whether they picked the zone they meant, which is the entire point of
 * showing a preview next to the dropdown.
 */
export function formatCurrentTimeIn(zone: string, now: Date = new Date()): string | null {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    }).format(now);
  } catch {
    return null;
  }
}
