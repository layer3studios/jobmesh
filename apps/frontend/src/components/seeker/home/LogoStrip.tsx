// FILE: src/components/seeker/home/LogoStrip.tsx
// Section 4 — a centred bar of company marks and nothing else. No names, no
// role counts, no cards: at 30px the logos are recognised, not read. Sits on
// --surface so it separates from the --paper sections by shade alone.
//
// CompanyLogo owns the whole resolution chain (logo.dev → Clearbit → initial),
// so we never render a fallback ourselves.
import { COPY } from '../../../theme/brand';
import type { ICompany } from '../../../types';
import CompanyLogo from '../CompanyLogo';

const MAX_LOGOS = 10;
const LOGO_SIZE = 30;

export default function LogoStrip({ companies }: { companies: ICompany[] }) {
  const shown = companies.slice(0, MAX_LOGOS);
  if (shown.length === 0) return null; // no directory → hide the whole section

  return (
    <section className="hm-section hm-logos" aria-labelledby="logos-heading">
      <h2 id="logos-heading" className="hm-eyebrow hm-mono" style={{ textAlign: 'center', marginBottom: 18, fontWeight: 400 }}>
        {COPY.home.logoStripLabel}
      </h2>
      <div className="hm-logos__row">
        {shown.map(c => (
          <CompanyLogo
            key={c._id || c.companyName}
            name={c.companyName}
            domain={c.domain}
            size={LOGO_SIZE}
            borderRadius={7}
          />
        ))}
      </div>
    </section>
  );
}
