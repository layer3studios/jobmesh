// FILE: src/components/seeker/home/MeshSpine.tsx
// "What happens inside the mesh" — the slow beat. One hairline runs down the
// centre of the page and six features alternate left and right of it, three
// for seekers then three for companies. Each beat is a short declarative
// statement, one line of prose and a hairline illustration of the real feature.
import { COPY } from '../../../theme/brand';
import { ResumeScoreVisual, SalaryBandsVisual, ProofOfWorkVisual } from './SpineSeekerVisuals';
import { RankedVisual, PipelineVisual, AvailabilityVisual } from './SpineCompanyVisuals';
import InkImage from './InkImage';

interface Beat {
  audience: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

const BEATS: Beat[] = [
  { audience: COPY.home.spineSeekers, title: COPY.home.spine1Title, body: COPY.home.spine1Body, visual: <ResumeScoreVisual /> },
  { audience: COPY.home.spineSeekers, title: COPY.home.spine2Title, body: COPY.home.spine2Body, visual: <SalaryBandsVisual /> },
  { audience: COPY.home.spineSeekers, title: COPY.home.spine3Title, body: COPY.home.spine3Body, visual: <ProofOfWorkVisual /> },
  { audience: COPY.home.spineCompanies, title: COPY.home.spine4Title, body: COPY.home.spine4Body, visual: <RankedVisual /> },
  { audience: COPY.home.spineCompanies, title: COPY.home.spine5Title, body: COPY.home.spine5Body, visual: <PipelineVisual /> },
  { audience: COPY.home.spineCompanies, title: COPY.home.spine6Title, body: COPY.home.spine6Body, visual: <AvailabilityVisual /> },
];

export default function MeshSpine() {
  return (
    <section className="hm-section hm-spine" aria-labelledby="spine-heading">
      {/* The third ink photograph, at the reference's 0.4 — quiet enough for
          the hairline illustrations to read over it. */}
      <InkImage name="ink-spine" treatment="band" opacity={0.4} />
      <div className="hm-show__veil" aria-hidden="true" />

      <h2 id="spine-heading" className="hm-serif hm-spine__title" data-reveal>{COPY.home.spineHeading}</h2>

      <div className="hm-spine__rail">
        {BEATS.map((beat, index) => (
          <article key={beat.title} className={`hm-beat${index % 2 === 1 ? ' hm-beat--flip' : ''}`}>
            <div className="hm-beat__copy">
              <p className="hm-beat__eyebrow hm-mono">{beat.audience}</p>
              <h3 className="hm-beat__title">{beat.title}</h3>
              <p className="hm-beat__body">{beat.body}</p>
            </div>
            <div className="hm-beat__visual">{beat.visual}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
