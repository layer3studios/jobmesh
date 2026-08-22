// FILE: src/lib/maps-url.ts
// Google Maps search URL from a free-text address. Shared by the employer
// interview card and the candidate booking page.
export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
