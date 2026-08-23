// FILE: src/components/apply/CultureSection.tsx
// "Why work here" on the public careers page — headline, description, benefits,
// photos. Server Component: it is static content with no interaction, so none of
// it needs to ship as JavaScript.
//
// PARTIAL CONTENT IS THE NORMAL CASE. An employer who filled in only benefits, or
// only a headline, gets a section containing exactly that. Each block is rendered
// only when it has something in it, and a section with nothing in it renders
// nothing at all rather than an empty state — the careers page belongs to the
// employer, and an "add your culture section" prompt would be us talking to them
// on a page meant for candidates.

import type { PublicCultureSection } from '@/types/public-apply';

/** Truncate an over-long benefit blurb rather than letting one row tower over its neighbours. */
const MAXIMUM_BENEFIT_DESCRIPTION_LENGTH = 150;

function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

/** True when there is anything at all worth rendering. */
export function hasCultureContent(section: PublicCultureSection | null | undefined): boolean {
  if (!section) return false;
  return Boolean(section.headline)
    || Boolean(section.description)
    || section.benefits.length > 0
    || section.photoUrls.length > 0;
}

export default function CultureSection({
  section, companyName,
}: {
  section: PublicCultureSection | null | undefined;
  companyName: string;
}) {
  if (!hasCultureContent(section) || !section) return null;

  return (
    <section className="careers-culture" aria-labelledby="careers-culture-heading">
      {/* The heading is always in the DOM for the landmark to point at, but falls
          back to a plain sentence when the employer wrote no headline of their own. */}
      <h2 id="careers-culture-heading" className="careers-culture-headline">
        {section.headline ?? `Why work at ${companyName}?`}
      </h2>

      {section.description && (
        <p className="careers-culture-description">{section.description}</p>
      )}

      {section.benefits.length > 0 && (
        <ul className="careers-culture-benefits">
          {section.benefits.map((benefit) => (
            <li className="careers-benefit" key={benefit.title}>
              {/* Decorative: the emoji repeats nothing the title does not already
                  say, so it is hidden from assistive tech rather than announced
                  as "sparkles". The disc still renders when there is no emoji, so
                  a mixed list keeps its alignment. */}
              <span className="careers-benefit-icon" aria-hidden="true">{benefit.icon ?? ''}</span>
              <div style={{ minWidth: 0 }}>
                <p className="careers-benefit-title">{benefit.title}</p>
                {benefit.description && (
                  <p className="careers-benefit-description">
                    {truncate(benefit.description, MAXIMUM_BENEFIT_DESCRIPTION_LENGTH)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {section.photoUrls.length > 0 && (
        <div className="careers-culture-photos">
          {section.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- these are
            // employer uploads streamed from our own API at unknown dimensions;
            // next/image would need a width/height pair we do not have.
            <img
              key={url}
              src={url}
              // The photos illustrate the words above them and carry no information
              // of their own, so a per-photo alt would be invented rather than
              // descriptive. Empty alt marks them decorative, which is honest.
              alt=""
              loading="lazy"
              decoding="async"
              className="careers-culture-photo"
            />
          ))}
        </div>
      )}
    </section>
  );
}
