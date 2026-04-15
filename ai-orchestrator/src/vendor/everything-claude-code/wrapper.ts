import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const installScript = join(__dirname, 'install.sh');
const repoDir = join(__dirname, 'repo');

export function ensureInstalled(): boolean {
  try {
    execSync(`bash "${installScript}"`, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

export function isInstalled(): boolean {
  try {
    execSync(`test -d "${repoDir}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getRepoPath(): string {
  return repoDir;
}
