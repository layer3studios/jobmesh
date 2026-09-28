// FILE: src/api/public/public-blog-routes.js
// GET /api/public/blog and /api/public/blog/:slug — the published blog, read by
// the Next.js /blog pages and the sitemap. Unauthenticated; drafts are never
// returned (the model filters on status: 'published').

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  listPublishedPosts as defaultList,
  findPublishedPostBySlug as defaultFindBySlug,
  toPublicPost,
} from '../../models/content/blog-post-model.js';

export function createPublicBlogRouter(deps = {}) {
  const { listPublishedPosts = defaultList, findPublishedPostBySlug = defaultFindBySlug } = deps;
  const router = Router();

  router.get('/', asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ data: { posts: await listPublishedPosts() } });
  }));

  router.get('/:slug', asyncHandler(async (req, res) => {
    const post = await findPublishedPostBySlug(req.params.slug);
    if (!post) throw new HttpError(404, 'Post not found', 'BLOG_POST_NOT_FOUND');
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ data: { post: toPublicPost(post) } });
  }));

  return router;
}

export default createPublicBlogRouter;
