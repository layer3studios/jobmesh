// JSON-LD Article builder for blog posts. Pure.
import { absoluteUrl } from '../site-url';

export interface ArticleSchemaInput {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: { '@type': 'Organization', name: input.author },
    publisher: { '@type': 'Organization', name: 'JobMesh', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.jpg') } },
  };
}
