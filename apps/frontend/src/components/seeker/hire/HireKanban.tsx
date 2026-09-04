// FILE: src/components/seeker/hire/HireKanban.tsx
// The ranked pipeline as a glass panel: four columns, candidates as cards
// with their AI score and a hairline bar, the offer card inverted. A picture
// of the employer kanban — illustrative names and scores, not live data.
import { COPY } from '../../../theme/brand';

interface Candidate { initials: string; name: string; role: string; score: number }

const COLUMNS: Candidate[][] = [
  [{ initials: 'AE', name: 'Alex E.', role: 'Senior backend', score: 88 }, { initials: 'SJ', name: 'Sam J.', role: 'MERN', score: 81 }],
  [{ initials: 'PS', name: 'Priya S.', role: 'Platform', score: 92 }, { initials: 'AM', name: 'Arjun M.', role: 'Backend', score: 87 }],
  [{ initials: 'NR', name: 'Neha R.', role: 'Full-stack', score: 91 }],
  [{ initials: 'KT', name: 'Karan T.', role: 'Staff', score: 94 }],
];

export default function HireKanban() {
  const columns = COPY.hire.kanbanColumns;
  return (
    <div className="hm-glass hr-kanban" aria-hidden="true">
      <p className="hm-panel__label hm-mono">{COPY.hire.kanbanLabel}</p>
      <div className="hr-kanban__columns">
        {columns.map((column, columnIndex) => {
          const isOffer = columnIndex === columns.length - 1;
          return (
            <div key={column.name} className="hr-kanban__column">
              <div className="hr-kanban__head hm-mono">
                <span>{column.name.toUpperCase()}</span>
                <span className="hr-kanban__count">{column.count}</span>
              </div>
              {COLUMNS[columnIndex].map(candidate => (
                <div key={candidate.name} className={`hr-card${isOffer ? ' hr-card--offer' : ''}`}>
                  <div className="hr-card__row">
                    <span className="hr-card__avatar hm-mono">{candidate.initials}</span>
                    <div className="hr-card__who">
                      <div className="hr-card__name">{candidate.name}</div>
                      <div className="hr-card__role">{candidate.role}</div>
                    </div>
                    <span className="hr-card__score hm-mono">{candidate.score}</span>
                  </div>
                  <div className="hr-card__track">
                    <div className="hr-card__fill" style={{ width: `${candidate.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
