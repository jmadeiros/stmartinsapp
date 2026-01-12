/**
 * Wave 4 Feature Validation Script
 *
 * Validates that all Wave 4 feature files and components exist:
 * - use-feed-realtime.ts hook
 * - storage.ts actions
 * - image-upload.tsx component
 * - edit-post-dialog.tsx component
 * - updatePost function in posts.ts
 * - Migration files for realtime and storage
 *
 * Run with: npx tsx scripts/validate-wave4.ts
 * Exit 0 if all pass, exit 1 if any missing
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

interface CheckResult {
  name: string;
  description: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

/**
 * Check if a file exists
 */
function checkFileExists(filePath: string, description: string): boolean {
  const fullPath = path.resolve(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);

  results.push({
    name: path.basename(filePath),
    description,
    passed: exists,
    details: exists ? `Found at ${filePath}` : `Missing: ${filePath}`,
  });

  return exists;
}

/**
 * Check if a file contains a specific string/pattern
 */
function checkFileContains(filePath: string, pattern: string | RegExp, description: string): boolean {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    results.push({
      name: `${path.basename(filePath)} (content)`,
      description,
      passed: false,
      details: `File not found: ${filePath}`,
    });
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const matches = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);

  results.push({
    name: `${path.basename(filePath)} (content)`,
    description,
    passed: matches,
    details: matches ? `Found pattern in ${filePath}` : `Pattern not found in ${filePath}`,
  });

  return matches;
}

/**
 * Check if any migration file exists matching a pattern
 */
function checkMigrationExists(pattern: RegExp, description: string): boolean {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');

  if (!fs.existsSync(migrationsDir)) {
    results.push({
      name: 'Migration check',
      description,
      passed: false,
      details: 'Migrations directory not found',
    });
    return false;
  }

  const files = fs.readdirSync(migrationsDir);
  const matchingFile = files.find((f) => pattern.test(f));

  results.push({
    name: 'Migration file',
    description,
    passed: !!matchingFile,
    details: matchingFile
      ? `Found: ${matchingFile}`
      : `No migration matching pattern found`,
  });

  return !!matchingFile;
}

// Main validation function
async function main() {
  console.log('\n');
  console.log(colors.bold + '=' .repeat(60) + colors.reset);
  console.log(colors.bold + colors.blue + '  WAVE 4 FEATURE VALIDATION CHECKLIST' + colors.reset);
  console.log(colors.bold + '=' .repeat(60) + colors.reset);
  console.log('\n');

  // ============================================
  // SECTION 1: Real-time Hook
  // ============================================
  console.log(colors.bold + '--- Real-time Subscriptions ---' + colors.reset + '\n');

  checkFileExists(
    'src/hooks/use-feed-realtime.ts',
    'useFeedRealtime hook for real-time feed updates'
  );

  checkFileContains(
    'src/hooks/use-feed-realtime.ts',
    'useFeedRealtime',
    'Hook export exists'
  );

  checkFileContains(
    'src/hooks/use-feed-realtime.ts',
    /subscribeToFeed|subscribe|realtime/i,
    'Subscription logic present'
  );

  // ============================================
  // SECTION 2: Storage Actions
  // ============================================
  console.log('\n' + colors.bold + '--- File/Image Storage ---' + colors.reset + '\n');

  checkFileExists(
    'src/lib/actions/storage.ts',
    'Storage server actions for file uploads'
  );

  checkFileContains(
    'src/lib/actions/storage.ts',
    'uploadImage',
    'uploadImage function exists'
  );

  checkFileContains(
    'src/lib/actions/storage.ts',
    /StorageBucket|avatars|post-images/,
    'Storage bucket types defined'
  );

  checkFileContains(
    'src/lib/actions/storage.ts',
    'uploadAvatar',
    'uploadAvatar convenience function exists'
  );

  checkFileContains(
    'src/lib/actions/storage.ts',
    'uploadPostImage',
    'uploadPostImage convenience function exists'
  );

  // ============================================
  // SECTION 3: Image Upload Component
  // ============================================
  console.log('\n' + colors.bold + '--- Image Upload Component ---' + colors.reset + '\n');

  checkFileExists(
    'src/components/ui/image-upload.tsx',
    'ImageUpload component for file selection'
  );

  checkFileContains(
    'src/components/ui/image-upload.tsx',
    'ImageUpload',
    'ImageUpload component export'
  );

  checkFileContains(
    'src/components/ui/image-upload.tsx',
    /onImageSelect|handleFile/,
    'Image selection handler logic'
  );

  checkFileContains(
    'src/components/ui/image-upload.tsx',
    /drag|drop/i,
    'Drag and drop support'
  );

  // ============================================
  // SECTION 4: Edit Post Dialog
  // ============================================
  console.log('\n' + colors.bold + '--- Post Editing ---' + colors.reset + '\n');

  checkFileExists(
    'src/components/social/edit-post-dialog.tsx',
    'EditPostDialog component for editing posts'
  );

  checkFileContains(
    'src/components/social/edit-post-dialog.tsx',
    'EditPostDialog',
    'EditPostDialog component export'
  );

  checkFileContains(
    'src/components/social/edit-post-dialog.tsx',
    'updatePost',
    'Uses updatePost action'
  );

  // ============================================
  // SECTION 5: Posts Action - updatePost
  // ============================================
  console.log('\n' + colors.bold + '--- Posts Actions ---' + colors.reset + '\n');

  checkFileExists(
    'src/lib/actions/posts.ts',
    'Posts server actions'
  );

  checkFileContains(
    'src/lib/actions/posts.ts',
    /export\s+(async\s+)?function\s+updatePost/,
    'updatePost function exported'
  );

  checkFileContains(
    'src/lib/actions/posts.ts',
    'createPost',
    'createPost function exists'
  );

  // ============================================
  // SECTION 6: Migration Files
  // ============================================
  console.log('\n' + colors.bold + '--- Database Migrations ---' + colors.reset + '\n');

  checkMigrationExists(
    /realtime|enable_feed/i,
    'Real-time feed migration'
  );

  checkMigrationExists(
    /storage|bucket/i,
    'Storage bucket migration'
  );

  // ============================================
  // SECTION 7: Supporting Components
  // ============================================
  console.log('\n' + colors.bold + '--- Supporting Components ---' + colors.reset + '\n');

  checkFileExists(
    'src/components/ui/post-menu.tsx',
    'PostMenu component with edit option'
  );

  checkFileExists(
    'src/components/social/post-card.tsx',
    'PostCard component'
  );

  checkFileContains(
    'src/components/social/post-card.tsx',
    'EditPostDialog',
    'PostCard imports EditPostDialog'
  );

  // ============================================
  // RESULTS SUMMARY
  // ============================================
  console.log('\n');
  console.log(colors.bold + '=' .repeat(60) + colors.reset);
  console.log(colors.bold + colors.blue + '  VALIDATION RESULTS' + colors.reset);
  console.log(colors.bold + '=' .repeat(60) + colors.reset);
  console.log('\n');

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.passed
      ? colors.green + '[PASS]' + colors.reset
      : colors.red + '[FAIL]' + colors.reset;

    console.log(`${icon} ${result.description}`);
    if (!result.passed && result.details) {
      console.log(`       ${colors.yellow}${result.details}${colors.reset}`);
    }

    if (result.passed) passCount++;
    else failCount++;
  }

  console.log('\n');
  console.log(colors.bold + '=' .repeat(60) + colors.reset);

  const totalChecks = results.length;
  const passRate = Math.round((passCount / totalChecks) * 100);

  console.log(`\nTotal Checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (failCount === 0) {
    console.log(colors.green + colors.bold + 'All Wave 4 validation checks passed!' + colors.reset);
    console.log('\n');
    process.exit(0);
  } else {
    console.log(colors.red + colors.bold + `${failCount} validation check(s) failed.` + colors.reset);
    console.log('\n');
    console.log('Missing components may need to be implemented:');
    for (const result of results) {
      if (!result.passed) {
        console.log(`  - ${result.name}: ${result.description}`);
      }
    }
    console.log('\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Validation script error:', error);
  process.exit(1);
});
