'use client';
// FILE: settings/team/parts/RoleTiles.tsx
// The four role explainer tiles above the member table.

export const ROLE_DOT_COLOR: Record<string, string> = {
  founder: 'var(--accent)', owner: 'var(--cat-purple)', member: 'var(--cat-green)', interviewer: 'var(--cat-amber)',
};

const TILES = [
  { role: 'founder', name: 'Founder', description: 'Full access. Billing, team, danger zone.' },
  { role: 'owner', name: 'Owner', description: 'Team, postings, candidates, settings.' },
  { role: 'member', name: 'Member', description: 'Postings, candidates, scheduling.' },
  { role: 'interviewer', name: 'Interviewer', description: 'View candidates. No scheduling.' },
];

export default function RoleTiles() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginBottom: 24 }}>
      {TILES.map((tile) => (
        <div key={tile.role} data-testid={`role-tile-${tile.role}`}
          style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
            <span data-testid="role-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: ROLE_DOT_COLOR[tile.role] }} />
            {tile.name}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, lineHeight: 1.4, color: 'var(--ink-faint)' }}>{tile.description}</p>
        </div>
      ))}
    </div>
  );
}
