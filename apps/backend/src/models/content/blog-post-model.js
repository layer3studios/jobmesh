// FILE: src/models/content/blog-post-model.js
// blog_posts collection — the public blog at jobmesh.in/blog, written from the
// admin panel (/admin/blog). Bodies are Markdown; the frontend renders them with
// react-markdown and NO raw HTML, so a post can never inject script.
//
// Only `published` posts are ever served publicly. A draft is invisible outside
// the admin panel, and publishing stamps publishedAt once (re-publishing an
// unpublished post keeps its original date).

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const postsCol = () => col('blog_posts');

export const BLOG_POST_STATUSES = Object.freeze(['draft', 'published']);

export const BLOG_LIMITS = Object.freeze({
  title: 120,
  description: 200,
  body: 100_000,
  tags: 8,
  tag: 40,
  author: 80,
  slug: 100,
});

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "How to find Remote Jobs!" → "how-to-find-remote-jobs" */
export function slugifyTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BLOG_LIMITS.slug)
    .replace(/-+$/g, '');
}

/**
 * Validate and normalise an admin's input. `partial` is for PATCH: only the
 * fields present are checked. Returns { ok: true, value } or { ok: false, errors }.
 */
export function validateBlogPostInput(input, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const src = input && typeof input === 'object' ? input : {};
  const has = (key) => Object.hasOwn(src, key);

  const text = (key, { required, max }) => {
    if (!has(key)) { if (required && !partial) errors[key] = 'Required'; return; }
    if (typeof src[key] !== 'string') { errors[key] = 'Must be text'; return; }
    const trimmed = src[key].trim();
    if (required && !trimmed) { errors[key] = 'Required'; return; }
    if (trimmed.length > max) { errors[key] = `At most ${max} characters`; return; }
    value[key] = trimmed;
  };

  text('title', { required: true, max: BLOG_LIMITS.title });
  text('description', { required: true, max: BLOG_LIMITS.description });
  text('body', { required: true, max: BLOG_LIMITS.body });
  text('author', { required: false, max: BLOG_LIMITS.author });

  if (has('slug')) {
    const slug = typeof src.slug === 'string' ? src.slug.trim().toLowerCase() : '';
    if (!slug) {
      if (!partial && value.title) value.slug = slugifyTitle(value.title);
    } else if (!SLUG_RE.test(slug) || slug.length > BLOG_LIMITS.slug) {
      errors.slug = 'Use lowercase letters, numbers and single hyphens';
    } else {
      value.slug = slug;
    }
  } else if (!partial && value.title) {
    value.slug = slugifyTitle(value.title);
  }
  if (!partial && !errors.slug && !value.slug && !errors.title) errors.slug = 'Could not derive a slug from the title';

  if (has('tags')) {
    if (!Array.isArray(src.tags) || src.tags.some((tag) => typeof tag !== 'string')) {
      errors.tags = 'Must be a list of text tags';
    } else {
      const tags = [...new Set(src.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
      if (tags.length > BLOG_LIMITS.tags) errors.tags = `At most ${BLOG_LIMITS.tags} tags`;
      else if (tags.some((tag) => tag.length > BLOG_LIMITS.tag)) errors.tags = `Each tag at most ${BLOG_LIMITS.tag} characters`;
      else value.tags = tags;
    }
  }

  if (has('status')) {
    if (!BLOG_POST_STATUSES.includes(src.status)) errors.status = 'Must be draft or published';
    else value.status = src.status;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Public shape. Never includes admin ids. */
export function toPublicPost(doc) {
  if (!doc) return null;
  return {
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    body: doc.body,
    author: doc.author || 'JobMesh team',
    tags: doc.tags ?? [],
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

/** Admin shape: public fields plus id, status and bookkeeping. */
export function toAdminPost(doc) {
  if (!doc) return null;
  return {
    ...toPublicPost(doc),
    id: doc._id.toString(),
    status: doc.status,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

export async function ensureBlogPostIndexes() {
  const collection = await postsCol();
  await collection.createIndex({ slug: 1 }, { unique: true, name: 'blog_posts_slug' });
  await collection.createIndex({ status: 1, publishedAt: -1 }, { name: 'blog_posts_published' });
}

/** Admin list: every post, newest edit first. Bodies omitted — the list never shows them. */
export async function listAllPosts() {
  const collection = await postsCol();
  const docs = await collection.find({}, { projection: { body: 0 } }).sort({ updatedAt: -1 }).limit(500).toArray();
  return docs.map((doc) => {
    const { body: _body, ...rest } = toAdminPost({ ...doc, body: '' });
    return rest;
  });
}

export async function findPostById(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const collection = await postsCol();
  return collection.findOne({ _id });
}

/** Public list: published only, newest first. */
export async function listPublishedPosts({ limit = 100 } = {}) {
  const collection = await postsCol();
  const docs = await collection
    .find({ status: 'published' }, { projection: { body: 0 } })
    .sort({ publishedAt: -1 })
    .limit(Math.min(Math.max(1, limit), 500))
    .toArray();
  return docs.map((doc) => {
    const { body: _body, ...rest } = toPublicPost({ ...doc, body: '' });
    return rest;
  });
}

export async function findPublishedPostBySlug(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  const collection = await postsCol();
  return collection.findOne({ slug, status: 'published' });
}

const isDuplicateKey = (err) => err?.code === 11000;

export async function createPost(value, adminUserId) {
  const collection = await postsCol();
  const now = new Date();
  const status = value.status ?? 'draft';
  const doc = {
    slug: value.slug,
    title: value.title,
    description: value.description,
    body: value.body,
    author: value.author || 'JobMesh team',
    tags: value.tags ?? [],
    status,
    publishedAt: status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
    createdByAdminUserId: adminUserId ?? null,
    updatedByAdminUserId: adminUserId ?? null,
  };
  try {
    const { insertedId } = await collection.insertOne(doc);
    return { ok: true, post: { ...doc, _id: insertedId } };
  } catch (err) {
    if (isDuplicateKey(err)) return { ok: false, reason: 'slug_taken' };
    throw err;
  }
}

export async function updatePost(id, value, adminUserId) {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, reason: 'not_found' };
  const collection = await postsCol();
  const existing = await collection.findOne({ _id });
  if (!existing) return { ok: false, reason: 'not_found' };

  const set = { ...value, updatedAt: new Date(), updatedByAdminUserId: adminUserId ?? null };
  if (value.status === 'published' && !existing.publishedAt) set.publishedAt = new Date();
  try {
    const post = await collection.findOneAndUpdate({ _id }, { $set: set }, { returnDocument: 'after' });
    return { ok: true, post, before: existing };
  } catch (err) {
    if (isDuplicateKey(err)) return { ok: false, reason: 'slug_taken' };
    throw err;
  }
}

export async function deletePost(id) {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, reason: 'not_found' };
  const collection = await postsCol();
  const existing = await collection.findOneAndDelete({ _id });
  return existing ? { ok: true, post: existing } : { ok: false, reason: 'not_found' };
}
