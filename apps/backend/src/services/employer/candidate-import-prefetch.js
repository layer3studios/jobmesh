// FILE: src/services/employer/candidate-import-prefetch.js
// The per-batch lookup tables bulk import builds once and threads through every
// row. Split out of candidate-import-service.js: that file is about importing ONE
// candidate, this one is about what a BATCH can know in advance.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import {
  createTag, normalizeTagName, TAGS_PER_APPLICATION_MAX,
} from '../../models/employer/candidate-tag-model.js';

const toOid = (id) => {
  if (id instanceof ObjectId) return id;
  return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : null;
};

/**
 * Everything a batch can look up ONCE instead of once per row.
 *
 * A 200-row import was ~1,000 sequential queries because each row independently
 * asked "does this contact exist", "has it already applied here", and "is each of
 * its tags in the library". None of those answers change per row in a way a single
 * upfront read cannot capture, so this does three reads for the whole file.
 *
 * The maps are LIVE, not a snapshot: importCandidate writes back into them as it
 * creates contacts, applications and tags, so row 2 sees what row 1 created. That
 * is what keeps two rows sharing an email from both being treated as new — and it
 * is why this object must not be reused across batches.
 */
export async function buildImportPrefetch(companyId, posting, rows) {
  const companyOid = toOid(companyId);
  const emails = [...new Set(
    (rows ?? []).map((row) => String(row?.email ?? '').trim().toLowerCase()).filter(Boolean),
  )];

  const contactsCollection = await col('contacts');
  const contacts = emails.length > 0
    ? await contactsCollection.find({ companyId: companyOid, email: { $in: emails } }).toArray()
    : [];
  const contactByEmail = new Map(contacts.map((contact) => [contact.email, contact]));

  // Only contacts that already exist can already have an application; a contact
  // this import is about to create cannot, so the $in covers the whole question.
  const applicationsCollection = await col('applications');
  const existing = contacts.length > 0
    ? await applicationsCollection.find(
      {
        companyId: companyOid,
        jobId: posting._id,
        contactId: { $in: contacts.map((contact) => contact._id) },
      },
      { projection: { contactId: 1 } },
    ).toArray()
    : [];
  const appliedContactIds = new Set(existing.map((row) => row.contactId?.toString()));

  // WHICH CONTACTS appliedContactIds IS AUTHORITATIVE FOR.
  //
  // The applications read above only asked about the contacts this batch's emails
  // resolved to. For anyone else the set is silent, and silence is not "has not
  // applied" — the ZIP path discovers emails by parsing each PDF inside the loop,
  // so its rows are not represented here at all. Treating an uncovered contact as
  // new would create a second application for someone who already applied.
  //
  // So a contact is covered when it was part of that read, or when this batch
  // created it (brand new — it cannot have a prior application). Everyone else
  // falls through to the per-row query, exactly as before.
  const coveredContactIds = new Set(contacts.map((contact) => contact._id.toString()));

  // The whole library, not just the names in this file: it is one small
  // per-company collection, and every row would otherwise probe it per tag.
  const tagsCollection = await col('candidate_tags');
  const tags = await tagsCollection
    .find({ companyId: companyOid }, { projection: { name: 1 } })
    .toArray();
  const knownTagNames = new Set(tags.map((tag) => tag.name));

  return { contactByEmail, appliedContactIds, coveredContactIds, knownTagNames };
}

/**
 * Put every imported tag into the company's library before it lands on an
 * application. Without this, a CSV could write a name the library has never heard
 * of — and the next time someone edited that candidate's tags, the whole list
 * would be refused as unknown.
 */
export async function registerImportedTags(companyId, tags, knownTagNames = null) {
  const names = [...new Set((tags ?? []).map(normalizeTagName).filter(Boolean))]
    .slice(0, TAGS_PER_APPLICATION_MAX);
  for (const name of names) {
    // A name already in the library needs no write and, more to the point, no
    // read: createTag's first act is a findOne that the prefetched set answers.
    if (knownTagNames?.has(name)) continue;
    await createTag(companyId, name);
    knownTagNames?.add(name);
  }
  return names;
}
