// FILE: src/scripts/seed-blog-posts.js
// One-time (idempotent) seed of the three starter blog posts into blog_posts.
// A slug that already exists is left alone, so re-running never overwrites an
// edit made in the admin panel.
//
//   npm run seed:blog
import { readFile } from 'node:fs/promises';
import { connectToDb, closeDb } from '../Db/connection.js';
import { ensureBlogPostIndexes } from '../models/content/blog-post-model.js';

const DATA = new URL('./data/blog-starter-posts.json', import.meta.url);

async function main() {
  const db = await connectToDb();
  await ensureBlogPostIndexes();
  const posts = JSON.parse(await readFile(DATA, 'utf8'));
  const collection = db.collection('blog_posts');
  let inserted = 0;
  for (const post of posts) {
    const publishedAt = new Date(post.publishedAt);
    const result = await collection.updateOne(
      { slug: post.slug },
      {
        $setOnInsert: {
          ...post,
          status: 'published',
          publishedAt,
          createdAt: publishedAt,
          updatedAt: publishedAt,
          createdByAdminUserId: null,
          updatedByAdminUserId: null,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount) inserted += 1;
  }
  console.log(`[seed-blog] ${inserted} inserted, ${posts.length - inserted} already present`);
}

main()
  .catch((err) => { console.error('[seed-blog] failed:', err); process.exitCode = 1; })
  .finally(() => closeDb());
