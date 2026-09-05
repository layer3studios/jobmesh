// FILE: src/components/seeker/home/HowItWorks.tsx
// Section 5 — three steps answering the only question a first-time visitor
// has: do I have to sign up? (No.) Three hairline columns, numbered in mono;
// the serif title carries the weight, the body recedes.
import { COPY } from '../../../theme/brand';

const STEPS = [
  { title: COPY.home.step1Title, body: COPY.home.step1Desc },
  { title: COPY.home.step2Title, body: COPY.home.step2Desc },
  { title: COPY.home.step3Title, body: COPY.home.step3Desc },
];

export default function HowItWorks() {
  return (
    <section className="hm-section hm-how" aria-labelledby="how-heading">
      <div className="hm-wrap">
        <h2 id="how-heading" className="hm-eyebrow hm-mono" style={{ marginBottom: 22, fontWeight: 400 }}>
          {COPY.home.howItWorksLabel}
        </h2>

        <div className="hm-how__grid">
          {STEPS.map((step, index) => (
            <div key={step.title} className="hm-step" data-reveal>
              <div className="hm-step__n hm-mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
              <h3 className="hm-serif hm-step__title">{step.title}</h3>
              <p className="hm-step__body">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
