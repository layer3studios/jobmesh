// FILE: src/models/public/application-collection.js
// The applications collection handle and the id coercion both halves of the model
// need. Exists so application-model.js (writes) and application-queries.js (reads)
// can be separate files without either owning the other's plumbing.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

export const applicationsCol = () => col('applications');

/** Accept a string or ObjectId; return an ObjectId or null. */
export function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}
