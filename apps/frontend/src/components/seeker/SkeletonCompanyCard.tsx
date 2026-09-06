// FILE: src/components/seeker/SkeletonCompanyCard.tsx
// The directory card's own shape while it loads: logo tile, two lines, the
// big number and the cities.
export default function SkeletonCompanyCard() {
  return (
    <div className="glass dir-card" aria-hidden>
      <div className="dir-card__top">
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 11 }} />
        <div style={{ flex: 1, display: 'grid', gap: 7 }}>
          <div className="skeleton" style={{ height: 13, width: '68%' }} />
          <div className="skeleton" style={{ height: 11, width: '42%' }} />
        </div>
      </div>
      <div className="dir-card__foot">
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="skeleton" style={{ height: 24, width: 34 }} />
          <div className="skeleton" style={{ height: 9, width: 70 }} />
        </div>
        <div className="skeleton" style={{ height: 10, width: 110 }} />
      </div>
    </div>
  );
}
