// FILE: settings/parts/SettingsPageHeader.tsx
// Shared title block for every /employer/settings/* page, so the sub-pages
// share one vertical rhythm with the Team page.

export default function SettingsPageHeader({ title, subtitle }: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>{subtitle}</p>
      )}
    </div>
  );
}
