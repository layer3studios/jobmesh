// FILE: src/app/indexnow-key.txt/route.ts
// IndexNow ownership proof. The backend submits new URLs to Bing with
// keyLocation=https://jobmesh.in/indexnow-key.txt; Bing fetches this file and
// checks it holds the same INDEXNOW_KEY. Set the key on BOTH tiers. Without it
// this 404s and the backend never submits anything.
export const dynamic = 'force-dynamic';

export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return new Response('Not found', { status: 404 });
  return new Response(key, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
