'use client';
// FILE: src/components/seeker/SkillsEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { useSeeker } from '../../context/seeker/SeekerContext';
import { Button } from '../ui';
import { Z } from '@/theme/tokens';

interface Props { onClose: () => void; }

const SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API',
  'Next.js', 'Tailwind CSS', 'Git', 'Figma', 'Jira', 'Java',
  'Go', 'Rust', 'Redis', 'CI/CD', 'Linux',
];

export default function SkillsEditor({ onClose }: Props) {
  const { userSkills, saveSkills } = useSeeker();
  const [skills, setSkills] = useState<string[]>(userSkills);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const add = (s: string) => {
    const trim = s.trim();
    if (!trim || skills.includes(trim)) return;
    setSkills(prev => [...prev, trim]);
    setInput('');
  };
  const remove = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    setSaving(true);
    try { await saveSkills(skills); onClose(); }
    finally { setSaving(false); }
  };

  const sugg = SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 12);

  return (
    <div
      role="dialog"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.modal,
        background: 'rgba(15,15,14,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'sheetFadeIn 0.25s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="anim-scale"
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)' }}>
              Your skills
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--paper-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

        <div className="thin-scroll" style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 16 }}>
            Add the skills you have or want to work with. We use these to highlight matching roles in the feed.
          </p>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); add(input); }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a skill and press enter…"
              style={{
                flex: 1, padding: '10px 12px',
                fontFamily: 'inherit', fontSize: '0.9rem',
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            />
            <Button type="submit" variant="primary" size="md">
              <Plus size={14} /> Add
            </Button>
          </form>

          {/* Selected chips */}
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={sectionLabel}>Selected ({skills.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(s => (
                  <span key={s} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 6px 5px 11px',
                    borderRadius: 999,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontSize: '0.82rem', fontWeight: 500,
                  }}>
                    {s}
                    <button onClick={() => remove(s)} style={{
                      width: 18, height: 18, borderRadius: 999,
                      border: 'none', background: 'rgba(0,0,0,0.08)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'inherit',
                    }} aria-label={`Remove ${s}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {sugg.length > 0 && (
            <div>
              <p style={sectionLabel}>Common skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sugg.map(s => (
                  <button key={s} onClick={() => add(s)} style={{
                    padding: '5px 11px', borderRadius: 999,
                    fontSize: '0.82rem', fontWeight: 500,
                    background: 'transparent',
                    color: 'var(--ink-muted)',
                    border: '1px dashed var(--border-strong)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          background: 'var(--paper-2)',
        }}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
            Save skills
          </Button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--ink-faint)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 8,
};
