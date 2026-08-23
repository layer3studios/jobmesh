// FILE: src/server.js
// Application entry. Wires middleware, routes, and scheduled tasks.

import express from 'express';
import cron from 'node-cron';

import { PORT, RUN_SCRAPER_ON_START, SYNC_ENABLED } from './env.js';
import { connectToDb, closeDb } from './Db/connection.js';

import { ensureInterviewIndexes, ensureInterviewReminderJobIndexes, ensureInterviewTimeIndexes } from './models/interview/index.js';
import { startInterviewReminderWorker } from './services/interview/interview-reminder-worker.js';

import { initGemma } from './gemma/index.js';

import { runScraper } from './tasks/runScraper.js';

import employerTeamRouter, { acceptRouter as employerInviteAcceptRouter } from './api/employer/employer-team-routes.js';
import {
  ensureAssignmentDirectories, sweepOldStagedFiles,
} from './services/public/assignment-storage-service.js';
import {
  reconcileAssignmentFiles, collectReferencedStagingPaths,
} from './services/public/assignment-file-reconciler.js';
import { startResumeParseWorker } from './services/seeker/resume-parse-worker.js';
import { ensureResumeScoreJobIndexes } from './models/public/resume-score-job-model.js';
import { startScoreWorker } from './services/public/resume-score-worker.js';

import { registerRoutes } from './register-routes.js';
import { runBootSequence } from './boot-indexes.js';

const app = express();

// ─── Routes + middleware (see register-routes.js) ─────────────────
registerRoutes(app);


// ─── Boot ─────────────────────────────────────────────────────────
const server = app.listen(PORT, async () => {
  try {
    await runBootSequence();
    ensureAssignmentDirectories();
    // Recover files whose submission committed but whose rename never ran (crash
    // between the two halves of that dual write).
    const { promoted, missing } = await reconcileAssignmentFiles();
    console.log(`[assignments] reconciled ${promoted} files, ${missing} missing`);
    const swept = sweepOldStagedFiles({ referenced: await collectReferencedStagingPaths() });
    console.log(`[assignments] swept ${swept} stale staged files`);
    // Staged uploads that were never submitted are reclaimed daily; a single boot
    // sweep would leave a long-lived process accumulating them indefinitely. The
    // referenced set is recomputed each time — a file committed since the last
    // sweep must never be treated as an orphan just because it is old.
    setInterval(() => {
      collectReferencedStagingPaths()
        .then((referenced) => sweepOldStagedFiles({ referenced }))
        .catch((err) => console.warn('[assignments] sweep failed:', err.message));
    }, 24 * 60 * 60 * 1000).unref();

    // Gemma is optional — the server boots fine without keys. initGemma() builds
    // both pools and logs their status itself, including the no-keys case (C10).
    initGemma();

    // Async resume-parse queue: recover stuck jobs, sweep temp files, start polling.
    await startResumeParseWorker();
    console.log('[queue] resume parse worker started');

    // Persistent applicant-scoring queue (Q1): recover stuck jobs, spawn N slots.
    await ensureResumeScoreJobIndexes();
    await startScoreWorker();

    // 24h interview reminders (same in-process pattern as the score worker).
    await ensureInterviewReminderJobIndexes();
    startInterviewReminderWorker();

    console.log(`[server] listening on http://localhost:${PORT}`);

    // Daily scrape at 06:00 server time — gated on SYNC_ENABLED so .env can disable it.
    if (SYNC_ENABLED) {
      cron.schedule('0 6 * * *', () => {
        console.log('[cron] daily scrape');
        runScraper();
      });
      console.log('[cron] scheduled');
    } else {
      console.log('[cron] scrape schedule DISABLED (SYNC_ENABLED=false)');
    }

    if (RUN_SCRAPER_ON_START) {
      console.log('[boot] RUN_SCRAPER_ON_START is true — running initial scrape');
      runScraper();
    }
  } catch (err) {
    console.error('[server] failed to start', err);
    process.exit(1);
  }
});

// ─── Graceful shutdown ────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`[server] ${signal} — shutting down`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
  // hard-kill if close hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));