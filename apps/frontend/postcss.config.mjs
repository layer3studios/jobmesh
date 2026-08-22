// Tailwind v4 uses the @tailwindcss/postcss plugin (R7). No tailwind.config.js —
// tokens live in src/app/globals.css under @theme.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
