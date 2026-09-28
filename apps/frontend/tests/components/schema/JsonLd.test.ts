import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../../../src/components/schema/JsonLd';

describe('serializeJsonLd', () => {
  it('cannot be closed early by a </script> inside scraped HTML', () => {
    const out = serializeJsonLd({ description: '<p>Hi</p></script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
  });

  it('parses back to the original value', () => {
    const schema = { title: 'a < b', nested: { html: '<b>x</b>' } };
    expect(JSON.parse(serializeJsonLd(schema))).toEqual(schema);
  });
});
