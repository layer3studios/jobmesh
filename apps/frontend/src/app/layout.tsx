// FILE: src/app/layout.tsx
// Root layout. Loads fonts via next/font (SEO-PLAN §5 — no render-blocking @import),
// exposes them as the CSS variables globals.css references, runs the pre-hydration
// theme script (Risk 1 — no FOUC), and mounts global client providers.
import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4, JetBrains_Mono, Instrument_Serif, DM_Sans } from 'next/font/google';
import { Providers } from '../components/Providers';
import { SITE_URL } from '../lib/site-url';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Italic is loaded for the landing page's display headlines — a synthesised
// oblique on a serif reads as a mistake, so the real face is worth the bytes.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-source-serif', display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });
// The landing page's faces (Monochrome Editorial system): Instrument Serif for
// every statement, always italic; DM Sans for prose. Loaded here so the landing
// can reference them as variables like every other face.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap',
});
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

// viewport-fit=cover lets the page extend under the iPhone's dynamic island
// and home bar, and makes env(safe-area-inset-*) real so the landing nav and
// footer can pad themselves clear of both. Everything else is the default.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  // Set only when a canonical origin is configured (NEXT_PUBLIC_SITE_URL).
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: {
    default: 'JobMesh — Tech jobs in India, without the fluff',
    template: '%s | JobMesh',
  },
  description:
    'Fresh tech jobs from top Indian companies, updated daily. Direct apply links, no middlemen.',
  openGraph: { type: 'website', siteName: 'JobMesh' },
  twitter: { card: 'summary_large_image' },
};

// Runs before first paint: resolves the theme from the (unchanged) 'jm-theme' key
// or the OS preference and stamps data-theme so SSR HTML paints the right palette.
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('jm-theme');if(m!=='dark'&&m!=='light'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',m);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = `${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${dmSans.variable}`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={fontVars} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
