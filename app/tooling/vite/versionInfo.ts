import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PIXULI_ROOT } from './paths';

function getRealVersion(
  packageName: string,
  dependencies: Record<string, string | undefined>,
  devDependencies: Record<string, string | undefined>,
  isDevDependency = false,
): string {
  try {
    const packagePath = path.resolve(
      PIXULI_ROOT,
      'node_modules',
      packageName,
      'package.json',
    );
    const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageInfo.version;
  } catch {
    const source = isDevDependency ? devDependencies : dependencies;
    return source?.[packageName] ?? 'unknown';
  }
}

function getGitInfo(): { branch: string; commit: string } {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      cwd: PIXULI_ROOT,
    }).trim();
    const commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: PIXULI_ROOT,
    }).trim();
    return { branch, commit };
  } catch (error) {
    console.warn('无法获取Git信息:', error);
    return { branch: 'unknown', commit: 'unknown' };
  }
}

export interface PixuliPackageJson {
  version: string;
  name: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  debug?: { env?: { VITE_DEV_SERVER_URL?: string } };
}

export function createVersionInfo(pkg: PixuliPackageJson) {
  const gitInfo = getGitInfo();
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  return {
    version: pkg.version,
    name: pkg.name,
    description: pkg.description ?? '',
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
    frameworks: {
      react: getRealVersion('react', deps, devDeps),
      'react-dom': getRealVersion('react-dom', deps, devDeps),
      vite: getRealVersion('vite', deps, devDeps, true),
      typescript: getRealVersion('typescript', deps, devDeps, true),
      tailwindcss: getRealVersion('tailwindcss', deps, devDeps, true),
      electron: getRealVersion('electron', deps, devDeps, true),
    },
    dependencies: {
      'lucide-react': getRealVersion('lucide-react', deps, devDeps),
      'react-i18next': getRealVersion('react-i18next', deps, devDeps),
      zustand: getRealVersion('zustand', deps, devDeps),
      octokit: getRealVersion('octokit', deps, devDeps),
      'react-dropzone': getRealVersion('react-dropzone', deps, devDeps),
      'react-hot-toast': getRealVersion('react-hot-toast', deps, devDeps),
      'react-image-crop': getRealVersion('react-image-crop', deps, devDeps),
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    git: gitInfo,
  };
}
