// FILE: src/services/public/apply-do-not-contact-log.js
// A server-side breadcrumb when a flagged person applies again.
//
// THE APPLICATION IS STILL ACCEPTED, and the warning is deliberately NOT in the
// apply response: that payload goes to the CANDIDATE, and telling them they are
// flagged would leak an internal judgement straight back to its subject. The
// employer sees it because the flag lives on the contact and every applicant
// surface already renders it.

import { isDoNotContact } from '../../models/public/contact-do-not-contact-model.js';

/** A flagged person applying again is worth a server-side breadcrumb, nothing more. */
function logDoNotContactApplication(contact, posting) {
  if (!isDoNotContact(contact)) return;
  console.warn(`[apply] do-not-contact candidate applied to posting ${posting._id}`);
}

export { logDoNotContactApplication };
