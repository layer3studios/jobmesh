// FILE: src/components/seeker/home/HowItWorks.tsx
// Section 5 — three steps answering the only question a first-time visitor has:
// do I have to sign up? (No.) The band sits on --surface and the cards on
// --paper, so the cards pop without needing a heavy outline. The large accent
// numeral anchors each card; the title is deliberately heavier than the body.
import { COPY } from '../../../theme/brand';

const STEPS = [
  { title: COPY.home.step1Title, body: COPY.home.step1Desc },
  { title: COPY.home.step2Title, body: COPY.home.step2Desc },
  { title: COPY.home.step3Title, body: COPY.home.step3Desc },
];

export default function HowItWorks() {
  return (
    <section className="hm-section hm-how" aria-labelledby="how-heading">
      <h2 id="how-heading" className="hm-eyebrow hm-mono" style={{ marginBottom: 18, fontWeight: 400 }}>
        {COPY.home.howItWorksLabel}
      </h2>

      <div className="hm-how__grid">
        {STEPS.map((step, i) => (
          <div key={step.title} className={`hm-step anim-up${i > 0 ? ` hm-d${i}` : ''}`}>
            <div className="hm-step__n hm-mono" aria-hidden="true">{i + 1}</div>
            <h3 className="hm-step__title">{step.title}</h3>
            <p className="hm-step__body">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
