// FILE: src/components/schema/JsonLd.tsx
// Shared JSON-LD emitter (R4/SEO-PLAN §2). Renders inline in a Server Component's
// JSX — NOT in generateMetadata. Server-safe (no hooks / no client APIs), so it
// streams as part of the SSR HTML where crawlers can read it.
export function JsonLd({ schema }: { schema: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default JsonLd;
