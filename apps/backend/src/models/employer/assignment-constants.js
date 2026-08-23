// FILE: src/models/employer/assignment-constants.js
// The take-home limits, in one place.
//
// Their own file specifically to BREAK A CYCLE: assignment-model imports the
// normalisers, and the normalisers need these bounds. With the constants living
// on the model, that pair imported each other -- which ESM tolerates only because
// nothing reads them at module-evaluation time. That is a latent trap, not a
// design, so the shared values sit below both instead.

/** The file kinds a submission may carry. An empty allowedFileTypes means link-only. */
export const ALLOWED_FILE_TYPES = Object.freeze(['pdf', 'zip', 'md']);

export const MIN_ESTIMATED_HOURS = 1;

export const MAX_ESTIMATED_HOURS = 8;
