// FILE: src/components/seeker/public-profile/PublicProfileSections.tsx
// Skills, experience and education on the public profile.
//
// Each section RENDERS NOTHING when it has nothing to say. A candidate who hid
// their experience, or who never uploaded a resume, gets a shorter page — not a
// heading over an empty space that reads as missing data.
//
// Server-renderable (no hooks, no browser APIs), so the substance of the profile
// is in the SSR HTML where a crawler and a link preview can read it.
import { Check } from 'lucide-react';
import type {
  PublicProfile, PublicProfileExperience, PublicProfileEducation,
} from '@/types/public-profile';
import { verifiedSkillSet } from '@/lib/public-profile-summary';

function dateRange(start: string | null, end: string | null, isCurrent = false) {
  const to = isCurrent ? 'Present' : (end ?? '');
  return [start, to].filter(Boolean).join(' – ');
}

export function PublicSkills({ profile }: { profile: PublicProfile }) {
  if (profile.skills.length === 0) return null;
  const verified = verifiedSkillSet(profile);

  return (
    <section className="pp-section">
      <h2 className="pp-section-heading">Skills</h2>
      <div className="pp-skills">
        {profile.skills.map((skill) => {
          const isVerified = verified.has(skill);
          return (
            <span
              key={skill}
              className={`pp-skill${isVerified ? ' pp-skill--verified' : ''}`}
              // Says what the mark means. "Verified" alone would overclaim: all we
              // know is that a public record mentions this, not that they are good at it.
              title={isVerified ? 'Appears in their public LeetCode or GitHub record' : undefined}
            >
              {isVerified && <Check size={12} aria-hidden />}
              {skill}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function PublicExperience({ entries }: { entries: PublicProfileExperience[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="pp-section">
      <h2 className="pp-section-heading">Experience</h2>
      {/* Every entry, never paginated — this is a profile, not a feed, and a long
          career should read as a long career. */}
      <div className="pp-entries" data-ph-mask>
        {entries.map((entry, index) => (
          <article className="pp-entry" key={`${entry.company}-${entry.title}-${index}`}>
            <h3 className="pp-entry-title">{entry.title || 'Role'}</h3>
            <p className="pp-entry-meta">
              {[entry.company, dateRange(entry.startDate, entry.endDate, entry.isCurrent)]
                .filter(Boolean).join(' · ')}
            </p>
            {entry.responsibilities.length > 0 && (
              <ul className="pp-entry-bullets">
                {entry.responsibilities.map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}
              </ul>
            )}
            {entry.technologies.length > 0 && (
              <div className="pp-entry-tech">
                {entry.technologies.map((tech) => <span className="pp-tech" key={tech}>{tech}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function PublicEducation({ entries }: { entries: PublicProfileEducation[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="pp-section">
      <h2 className="pp-section-heading">Education</h2>
      <div className="pp-entries" data-ph-mask>
        {entries.map((entry, index) => (
          <article className="pp-entry" key={`${entry.institution}-${index}`}>
            <h3 className="pp-entry-title">{entry.institution || 'Institution'}</h3>
            <p className="pp-entry-meta">
              {[
                [entry.degree, entry.field].filter(Boolean).join(', '),
                dateRange(entry.startDate, entry.endDate),
              ].filter(Boolean).join(' · ')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
