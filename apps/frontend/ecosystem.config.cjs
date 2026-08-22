// FILE: ecosystem.config.cjs
// pm2 process definition for the production frontend-next process (deploy.ps1 restarts
// `jobsync-fe-next` with --update-env). Runs the Next.js standalone server built by
// `next build` (output: 'standalone').
//
// NOTE (R8): NEXT_PUBLIC_* vars are INLINED into the client bundle at BUILD time, not
// read at runtime. They are mirrored here for consistency and for any server code that
// reads process.env, but changing a NEXT_PUBLIC_* value requires a rebuild + restart —
// updating this file and restarting pm2 alone is not enough.
module.exports = {
  apps: [
    {
      name: 'jobsync-fe-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        // PostHog (EU cloud) — mirrors .env.local. Consent-gated at runtime; see
        // src/components/analytics/PostHogProvider.tsx.
        NEXT_PUBLIC_POSTHOG_KEY: 'phc_w6NjGvvV8Dz7dhJt3EmwWkkqa6zqhyjnUHtw9aVuh2Mc',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
      },
    },
  ],
};
