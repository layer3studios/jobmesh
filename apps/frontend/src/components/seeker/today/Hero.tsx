// FILE: src/components/seeker/today/Hero.tsx
import ProgressRing from '../ProgressRing';
import { eyebrowStyle } from './shared';

interface Props {
  isDesktop: boolean;
  greeting: string;
  firstName: string;
  todayCount: number;
  dailyGoal: number;
  onGoalChange: (n: number) => void;
}

export default function Hero({ isDesktop, greeting, firstName, todayCount, dailyGoal, onGoalChange }: Props) {
  return (
    <div
      className="anim-up"
      style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
        gap: 24, alignItems: 'stretch', marginBottom: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={eyebrowStyle}>{greeting}</p>
        <h1 className="font-display" style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 400,
          color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1.02,
        }}>{firstName}.</h1>
        <p style={{ color: 'var(--ink-muted)', marginTop: 8, fontSize: '1rem', lineHeight: 1.55 }}>
          {todayCount > 0
            ? `You've applied to ${todayCount} role${todayCount === 1 ? '' : 's'} today.`
            : "Let's get a few applications out today."}
        </p>
      </div>

      {/* Quick-glance daily goal ring. Detailed stats (streak / totals / funnel)
          live on the Progress page so they aren't duplicated here. */}
      <div className="glass" style={{
        borderRadius: 14, padding: 'clamp(16px, 3vw, 22px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ProgressRing todayCount={todayCount} dailyGoal={dailyGoal} onGoalChange={onGoalChange} />
      </div>
    </div>
  );
}
