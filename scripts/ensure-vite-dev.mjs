#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { appendFileSync, closeSync, openSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { get } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = 5173;
const host = '127.0.0.1';
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logDir = resolve(rootDir, '.vscode');
const logPath = resolve(logDir, 'vite-dev.log');
const viteClientUrl = `http://${host}:${port}/@vite/client`;
const appUrl = `http://${host}:${port}/`;
const timeoutMs = 30_000;

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function isViteReady() {
  return new Promise((resolveReady) => {
    const request = get(viteClientUrl, (response) => {
      response.resume();
      resolveReady(response.statusCode === 200);
    });

    request.setTimeout(1000, () => {
      request.destroy();
      resolveReady(false);
    });

    request.on('error', () => {
      resolveReady(false);
    });
  });
}

async function waitForVite(child) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Vite dev server exited with code ${child.exitCode}. See ${logPath}`);
    }

    if (await isViteReady()) {
      return;
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for Vite dev server at ${appUrl}. See ${logPath}`);
}

if (await isViteReady()) {
  console.log(`Vite dev server already running at ${appUrl}`);
  process.exit(0);
}

await mkdir(logDir, { recursive: true });

appendFileSync(logPath, `\n[${new Date().toISOString()}] Starting Vite dev server\n`);
const logFd = openSync(logPath, 'a');

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(command, ['dev', '--port', String(port), '--strictPort'], {
  cwd: rootDir,
  detached: true,
  stdio: ['ignore', logFd, logFd],
});

closeSync(logFd);
child.unref();

try {
  await waitForVite(child);
  console.log(`Vite dev server ready at ${appUrl}`);
  console.log(`Vite log: ${logPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
