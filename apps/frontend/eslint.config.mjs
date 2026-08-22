import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

const compat = new FlatCompat({ baseDirectory: currentDirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // `**/` prefix catches Next's generated output at BOTH ./.next and ./src/.next
  // (the type validator files there are not source we control).
  { ignores: ['**/.next/**', '**/node_modules/**', 'next-env.d.ts'] },
  {
    // Apostrophes/quotes in JSX text are kept verbatim from the Vite source (the
    // original project did not enforce entity-escaping); the glyphs render
    // identically. Downgraded from error so the verbatim copy is preserved.
    rules: { 'react/no-unescaped-entities': 'off' },
  },
];

export default eslintConfig;
