// FILE: src/components/seeker/hire/HireProcess.tsx
// Four steps from posting to hire, on one hairline rail with a mono numeral
// each. Anchored as #how for the hero's secondary door.
import { COPY } from '../../../theme/brand';

export default function HireProcess() {
  return (
    <section id="how" className="hm-section hr-process" aria-labelledby="process-heading">
      <div className="hm-wrap">
        <h2 id="process-heading" className="hm-serif hm-heading hr-process__title" data-reveal>
          {COPY.hire.processHeading}
        </h2>
        <ol className="hr-steps">
          {COPY.hire.steps.map((step, index) => (
            <li key={step.title} className="hr-step" data-reveal>
              <span className="hr-step__n hm-mono">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="hr-step__title">{step.title}</h3>
                <p className="hr-step__body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
