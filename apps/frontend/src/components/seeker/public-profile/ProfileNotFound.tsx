// FILE: src/components/seeker/public-profile/ProfileNotFound.tsx
// What a stranger sees for an unknown slug, a renamed one, or a profile its owner
// turned off.
//
// ONE MESSAGE COVERS ALL THREE. "Doesn't exist or is private" is not vagueness for
// its own sake: distinguishing them would let anyone with a list of names probe
// which ones belong to real people who chose to stay private.
import { absoluteUrl } from '@/lib/site-url';

export default function ProfileNotFound() {
  return (
    <div className="pp-empty">
      <h1 className="pp-name">Profile not found</h1>
      <p className="pp-headline">This profile doesn&apos;t exist or is private.</p>
      <p className="pp-meta-row" style={{ justifyContent: 'center' }}>
        <a className="pp-action" href={absoluteUrl('/')}>Go to JobMesh</a>
      </p>
    </div>
  );
}
