// FILE: settings/parts/SettingsPageHeader.tsx
// Shared title block for every /employer/settings/* page: a mono eyebrow and a
// display title, the same rhythm as PageHeader, so the sub-pages read as one
// section of one product.

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function SettingsPageHeader({ title, subtitle }: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ margin: '0 0 8px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Settings</p>
      <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--ink)' }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{subtitle}</p>
      )}
    </div>
  );
}
