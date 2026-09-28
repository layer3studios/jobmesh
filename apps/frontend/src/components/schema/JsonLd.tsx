// FILE: src/components/schema/JsonLd.tsx
// Shared JSON-LD emitter (R4/SEO-PLAN §2). Renders inline in a Server Component's
// JSX — NOT in generateMetadata. Server-safe (no hooks / no client APIs), so it
// streams as part of the SSR HTML where crawlers can read it.
/**
 * JSON.stringify, made safe to inline in HTML. JobPosting carries raw scraped
 * description HTML; a literal `</script>` inside it closed this tag early, broke
 * the page's markup and dropped the schema. `<` is escaped as its JSON unicode
 * form, which parses back to the same string.
 */
export function serializeJsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function JsonLd({ schema }: { schema: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

export default JsonLd;
