// FILE: src/components/seeker/SkeletonCompanyCard.tsx
export default function SkeletonCompanyCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div style={{ flex: 1, display: 'grid', gap: 6 }}>
          <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: '90%', borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
    </div>
  );
}
