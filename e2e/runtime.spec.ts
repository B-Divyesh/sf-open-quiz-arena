import { execFileSync, spawn } from 'node:child_process';
import { expect, test } from '@playwright/test';

test('@claim:runtime-toolchain @claim:runtime-defaults builds with Node 22 and Rust stable, then serves dist on port 8080 by default', async ({ page, request }) => {
  expect(process.versions.node.split('.')[0]).toBe('22');
  expect(execFileSync('rustc', ['--version'], { encoding: 'utf8' })).toMatch(/^rustc 1\./);
  const health = await request.get('/health');
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual(expect.objectContaining({ status: 'ok', build: expect.any(String) }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Run one live quiz for your class.' })).toBeVisible();
});

test('@claim:runtime-port-health serves health when PORT is supplied', async () => {
  const port = 18081;
  const service = spawn('cargo', ['run', '--quiet'], {
    env: { ...process.env, PORT: String(port), STATIC_DIR: 'dist', BUILD_SHA: 'claim-port-health' },
    stdio: 'ignore',
  });
  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        response = await fetch(`http://127.0.0.1:${port}/health`);
        if (response.ok) break;
      } catch { /* The debug binary is still starting. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    expect(response?.ok).toBe(true);
    expect(await response?.json()).toEqual({ status: 'ok', build: 'claim-port-health' });
  } finally {
    service.kill('SIGTERM');
    await new Promise(resolve => service.once('exit', resolve));
  }
});
