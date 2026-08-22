// FILE: src/components/apply/SocialLinks.tsx
// A company's social links as icon buttons. Shared by the careers-page header and
// the apply success page, so the two can never drift into different icon sets or
// different link ordering.
//
// Order is fixed (LinkedIn, X, GitHub) rather than following object key order: a
// stable position means a returning candidate reaches for the same spot each time.

import { Linkedin, Twitter, Github } from 'lucide-react';
import type { PublicSocialLinks } from '@/types/public-apply';

const NETWORKS = [
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'twitter', label: 'X', Icon: Twitter },
  { key: 'github', label: 'GitHub', Icon: Github },
] as const;

export default function SocialLinks({
  links, companyName, size = 16,
}: {
  links: PublicSocialLinks | null | undefined;
  companyName: string;
  size?: number;
}) {
  if (!links) return null;
  const present = NETWORKS.filter((network) => links[network.key]);
  if (present.length === 0) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {present.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          // noopener is the security half; nofollow keeps an employer's careers page
          // from passing ranking signal to arbitrary linked profiles.
          rel="noopener noreferrer nofollow"
          aria-label={`${companyName} on ${label}`}
          title={label}
          className="careers-social-link"
        >
          <Icon size={size} aria-hidden />
        </a>
      ))}
    </div>
  );
}
