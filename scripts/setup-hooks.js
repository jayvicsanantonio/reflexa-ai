#!/usr/bin/env node

/**
 * Setup Git Hooks Script
 *
 * Configures Husky for Git hooks to ensure code quality before commits.
 * This script runs automatically after npm install via the "prepare" script.
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const HUSKY_DIR = '.husky';
const GIT_DIR = '.git';

// Check if this is a git repository
if (!existsSync(GIT_DIR)) {
  console.log('⚠️  Not a git repository. Skipping git hooks setup.');
  process.exit(0);
}

// Check if husky is installed
try {
  execSync('npm list husky', { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️  Husky not installed. Skipping git hooks setup.');
  process.exit(0);
}

console.log('🔧 Setting up git hooks...');

// Create .husky directory if it doesn't exist
if (!existsSync(HUSKY_DIR)) {
  mkdirSync(HUSKY_DIR, { recursive: true });
  console.log('   Created .husky directory');
}

// Initialize husky
try {
  execSync('npx husky init', { stdio: 'ignore' });
} catch (error) {
  // Husky might already be initialized, continue
}

// Create pre-commit hook
const preCommitPath = join(HUSKY_DIR, 'pre-commit');
const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and formatting checks before commit
echo "🔍 Running pre-commit checks..."

# Type checking
echo "   Checking types..."
npm run type-check || {
  echo "❌ Type check failed. Please fix type errors before committing."
  exit 1
}

# Linting
echo "   Running linter..."
npm run lint || {
  echo "❌ Linting failed. Run 'npm run lint:fix' to auto-fix issues."
  exit 1
}

# Format checking
echo "   Checking formatting..."
npm run format:check || {
  echo "❌ Formatting check failed. Run 'npm run format' to fix formatting."
  exit 1
}

echo "✅ Pre-commit checks passed!"
`;

writeFileSync(preCommitPath, preCommitContent);
chmodSync(preCommitPath, 0o755);
console.log('   Created pre-commit hook');

// Create pre-push hook
const prePushPath = join(HUSKY_DIR, 'pre-push');
const prePushContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests before push
echo "🧪 Running tests before push..."

npm run test || {
  echo "❌ Tests failed. Please fix failing tests before pushing."
  exit 1
}

echo "✅ All tests passed!"
`;

writeFileSync(prePushPath, prePushContent);
chmodSync(prePushPath, 0o755);
console.log('   Created pre-push hook');

console.log('✅ Git hooks setup complete!');
console.log('');
console.log('   Pre-commit: Type check, lint, and format check');
console.log('   Pre-push: Run all tests');
console.log('');
console.log('   To skip hooks temporarily, use: git commit --no-verify');
