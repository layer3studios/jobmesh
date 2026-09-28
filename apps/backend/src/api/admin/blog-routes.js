// FILE: src/api/admin/blog-routes.js
// /api/admin/blog — write the public blog from the admin panel. Mounted behind
// requireAdmin (register-routes.js), before the generic /api/admin router.
//
// Every admin can read posts (drafts included). Only a super_admin can create,
// edit, publish or delete: the blog is public copy under the company's name,
// so writes follow the same rule as admin-team mutations. Each write is audited.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  validateBlogPostInput,
  toAdminPost,
  listAllPosts as defaultListAll,
  findPostById as defaultFindById,
  createPost as defaultCreate,
  updatePost as defaultUpdate,
  deletePost as defaultDelete,
} from '../../models/content/blog-post-model.js';
import { appendAudit as defaultAppendAudit } from '../../services/dpdp/audit-log-service.js';
import { AUDIT_EVENTS } from '../../models/dpdp/dpdp-constants.js';
import { notifyIndexNow as defaultNotifyIndexNow } from '../../services/seo/indexnow-client.js';

function requireSuperAdmin(req, _res, next) {
  if (req.adminUser?.role !== 'super_admin') {
    return next(new HttpError(403, 'Only a super admin can change blog posts', 'SUPER_ADMIN_ONLY'));
  }
  return next();
}

function invalid(errors) {
  const error = new HttpError(400, 'Some fields need fixing', 'INVALID_BLOG_POST');
  error.details = errors;
  return error;
}

/** Deps are injectable so route tests need no database. */
export function createBlogAdminRouter(deps = {}) {
  const {
    listAllPosts = defaultListAll,
    findPostById = defaultFindById,
    createPost = defaultCreate,
    updatePost = defaultUpdate,
    deletePost = defaultDelete,
    appendAudit = defaultAppendAudit,
    notifyIndexNow = defaultNotifyIndexNow,
  } = deps;
  const router = Router();

  const audit = (req, event, post, metadata = {}) => appendAudit({
    event,
    actorType: 'admin',
    actorId: req.adminUser?.adminUserId ?? null,
    targetType: 'blog_post',
    targetId: post?._id ?? null,
    metadata: { slug: post?.slug, title: post?.title, ...metadata },
  });

  router.get('/', asyncHandler(async (_req, res) => {
    res.json({ data: { posts: await listAllPosts() } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const post = await findPostById(req.params.id);
    if (!post) throw new HttpError(404, 'Post not found', 'BLOG_POST_NOT_FOUND');
    res.json({ data: { post: toAdminPost(post) } });
  }));

  router.post('/', requireSuperAdmin, asyncHandler(async (req, res) => {
    const parsed = validateBlogPostInput(req.body);
    if (!parsed.ok) throw invalid(parsed.errors);
    const result = await createPost(parsed.value, req.adminUser?.adminUserId ?? null);
    if (!result.ok) throw invalid({ slug: 'Another post already uses this URL' });
    await audit(req, AUDIT_EVENTS.BLOG_POST_CREATED, result.post, { status: result.post.status });
    if (result.post.status === 'published') notifyIndexNow([`/blog/${result.post.slug}`, '/blog']);
    res.status(201).json({ data: { post: toAdminPost(result.post) } });
  }));

  router.patch('/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
    const parsed = validateBlogPostInput(req.body, { partial: true });
    if (!parsed.ok) throw invalid(parsed.errors);
    if (!Object.keys(parsed.value).length) throw invalid({ _: 'Nothing to update' });
    const result = await updatePost(req.params.id, parsed.value, req.adminUser?.adminUserId ?? null);
    if (!result.ok && result.reason === 'slug_taken') throw invalid({ slug: 'Another post already uses this URL' });
    if (!result.ok) throw new HttpError(404, 'Post not found', 'BLOG_POST_NOT_FOUND');
    await audit(req, AUDIT_EVENTS.BLOG_POST_UPDATED, result.post, {
      fields: Object.keys(parsed.value),
      oldStatus: result.before?.status,
      newStatus: result.post?.status,
    });
    // Published, edited while live, or just unpublished: search engines should re-fetch.
    if (result.post?.status === 'published' || result.before?.status === 'published') {
      const slugs = new Set([result.post?.slug, result.before?.slug].filter(Boolean));
      notifyIndexNow([...[...slugs].map((slug) => `/blog/${slug}`), '/blog']);
    }
    res.json({ data: { post: toAdminPost(result.post) } });
  }));

  router.delete('/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
    const result = await deletePost(req.params.id);
    if (!result.ok) throw new HttpError(404, 'Post not found', 'BLOG_POST_NOT_FOUND');
    await audit(req, AUDIT_EVENTS.BLOG_POST_DELETED, result.post);
    if (result.post?.status === 'published') notifyIndexNow([`/blog/${result.post.slug}`, '/blog']);
    res.json({ data: { deleted: true } });
  }));

  return router;
}

export default createBlogAdminRouter;
