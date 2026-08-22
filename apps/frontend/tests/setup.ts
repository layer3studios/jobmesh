// FILE: tests/setup.ts
// Global test setup. The current frontend registers @testing-library/jest-dom here;
// that matcher package is outside this chunk's dependency allow-list, so tests use
// plain Vitest assertions instead. We still register RTL's cleanup after each test.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
