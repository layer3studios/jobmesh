// FILE: src/components/ui/Stepper.tsx
// Horizontal progress stepper. Completed steps show a checkmark.
import { Check } from 'lucide-react';
import { TYPE } from '../../theme/tokens';

export interface Step { id: string; label: string }

export function Stepper({
  steps, currentStepId,
}: {
  steps: Step[];
  currentStepId: string;
  /** Reserved for future vertical support. @default 'horizontal' */
  direction?: 'horizontal';
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0, width: '100%' }}>
      {steps.map((step, i) => {
        const completed = i < currentIndex;
        const current = i === currentIndex;
        const dotBg = completed || current ? 'var(--accent)' : 'var(--surface)';
        const dotColor = completed || current ? 'var(--paper)' : 'var(--ink-muted)';
        return (
          <li key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span
                aria-current={current ? 'step' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: dotBg, color: dotColor,
                  border: `1px solid ${completed || current ? 'var(--accent)' : 'var(--border-strong)'}`,
                  fontSize: TYPE.sm, fontWeight: 600,
                }}
              >
                {completed ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              <span style={{ fontSize: TYPE.sm, fontWeight: current ? 600 : 500, color: current ? 'var(--ink)' : 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 24, background: completed ? 'var(--accent)' : 'var(--border)' }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
