// cli.test.ts
import { execSync } from 'child_process';
import { test, expect } from 'vitest';

test('cli outputs version', () => {
  const output = execSync('dito --version').toString();
  expect(output).toContain('0.0.1');
});
