/**
 * Wave 5 OAuth/Onboarding Validation Script
 *
 * This script validates that all required Wave 5 files and code patterns exist.
 * Run with: npx tsx scripts/validate-wave5.ts
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function checkFileExists(filePath: string, description: string): CheckResult {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);

  return {
    name: description,
    passed: exists,
    message: exists ? `File found: ${filePath}` : `File missing: ${filePath}`,
  };
}

function checkFileContains(filePath: string, pattern: string | RegExp, description: string): CheckResult {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return {
      name: description,
      passed: false,
      message: `File not found: ${filePath}`,
    };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  const found = regex.test(content);

  return {
    name: description,
    passed: found,
    message: found
      ? `Pattern found in ${filePath}`
      : `Pattern NOT found in ${filePath}`,
    details: typeof pattern === 'string' ? pattern : pattern.toString(),
  };
}

function runChecks() {
  console.log('\n========================================');
  console.log('Wave 5 OAuth/Onboarding Validation');
  console.log('========================================\n');

  // ============================================
  // FILE EXISTENCE CHECKS
  // ============================================
  console.log('--- File Existence Checks ---\n');

  results.push(checkFileExists(
    'src/app/onboarding/page.tsx',
    'Onboarding page exists'
  ));

  results.push(checkFileExists(
    'src/components/onboarding/onboarding-wizard.tsx',
    'Onboarding wizard component exists'
  ));

  results.push(checkFileExists(
    'src/lib/actions/onboarding.ts',
    'Onboarding actions file exists'
  ));

  results.push(checkFileExists(
    'src/app/login/page.tsx',
    'Login page exists'
  ));

  results.push(checkFileExists(
    'src/app/auth/callback/route.ts',
    'Auth callback route exists'
  ));

  // ============================================
  // OAUTH HANDLER CHECKS
  // ============================================
  console.log('--- OAuth Handler Checks ---\n');

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /signInWithOAuth/,
    'Login page uses signInWithOAuth'
  ));

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /provider:\s*['"]google['"]/,
    'Login page has Google OAuth provider'
  ));

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /provider:\s*['"]azure['"]/,
    'Login page has Microsoft/Azure OAuth provider'
  ));

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /Sign in with Google/,
    'Login page has Google sign-in button text'
  ));

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /Sign in with Microsoft/,
    'Login page has Microsoft sign-in button text'
  ));

  results.push(checkFileContains(
    'src/app/login/page.tsx',
    /redirectTo.*auth\/callback/,
    'OAuth redirectTo configured for auth callback'
  ));

  // ============================================
  // AUTH CALLBACK CHECKS
  // ============================================
  console.log('--- Auth Callback Route Checks ---\n');

  results.push(checkFileContains(
    'src/app/auth/callback/route.ts',
    /exchangeCodeForSession/,
    'Auth callback exchanges code for session'
  ));

  results.push(checkFileContains(
    'src/app/auth/callback/route.ts',
    /onboarding/,
    'Auth callback references onboarding route'
  ));

  results.push(checkFileContains(
    'src/app/auth/callback/route.ts',
    /user_profiles/,
    'Auth callback checks user profile'
  ));

  results.push(checkFileContains(
    'src/app/auth/callback/route.ts',
    /dashboard/,
    'Auth callback references dashboard route'
  ));

  // ============================================
  // ONBOARDING ACTION CHECKS
  // ============================================
  console.log('--- Onboarding Action Checks ---\n');

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /checkOnboardingStatus/,
    'checkOnboardingStatus action exists'
  ));

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /saveProfileStep/,
    'saveProfileStep action exists'
  ));

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /saveOrganizationStep/,
    'saveOrganizationStep action exists'
  ));

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /saveInterestsStep/,
    'saveInterestsStep action exists'
  ));

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /completeOnboarding/,
    'completeOnboarding action exists'
  ));

  results.push(checkFileContains(
    'src/lib/actions/onboarding.ts',
    /getOrganizationsForOnboarding/,
    'getOrganizationsForOnboarding action exists'
  ));

  // ============================================
  // ONBOARDING WIZARD COMPONENT CHECKS
  // ============================================
  console.log('--- Onboarding Wizard Component Checks ---\n');

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Profile/,
    'Wizard has Profile step'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Organization/,
    'Wizard has Organization step'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Interest/,
    'Wizard has Interests step'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Notification/,
    'Wizard has Notifications step'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Switch/,
    'Wizard uses Switch component for toggles'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /Badge/,
    'Wizard uses Badge component for skills/interests'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /handleNext/,
    'Wizard has handleNext navigation'
  ));

  results.push(checkFileContains(
    'src/components/onboarding/onboarding-wizard.tsx',
    /handleBack/,
    'Wizard has handleBack navigation'
  ));

  // ============================================
  // ONBOARDING PAGE CHECKS
  // ============================================
  console.log('--- Onboarding Page Checks ---\n');

  results.push(checkFileContains(
    'src/app/onboarding/page.tsx',
    /OnboardingWizard/,
    'Onboarding page renders OnboardingWizard'
  ));

  results.push(checkFileContains(
    'src/app/onboarding/page.tsx',
    /checkOnboardingStatus/,
    'Onboarding page calls checkOnboardingStatus'
  ));

  results.push(checkFileContains(
    'src/app/onboarding/page.tsx',
    /getOrganizationsForOnboarding/,
    'Onboarding page fetches organizations'
  ));

  results.push(checkFileContains(
    'src/app/onboarding/page.tsx',
    /redirect.*dashboard/,
    'Onboarding page redirects completed users to dashboard'
  ));

  results.push(checkFileContains(
    'src/app/onboarding/page.tsx',
    /redirect.*login/,
    'Onboarding page redirects unauthenticated users to login'
  ));

  // ============================================
  // OUTPUT RESULTS
  // ============================================
  console.log('\n========================================');
  console.log('Validation Results');
  console.log('========================================\n');

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  // Print passed checks
  if (passed.length > 0) {
    console.log('PASSED CHECKS:');
    passed.forEach((r) => {
      console.log(`  [PASS] ${r.name}`);
    });
    console.log('');
  }

  // Print failed checks
  if (failed.length > 0) {
    console.log('FAILED CHECKS:');
    failed.forEach((r) => {
      console.log(`  [FAIL] ${r.name}`);
      console.log(`         ${r.message}`);
      if (r.details) {
        console.log(`         Pattern: ${r.details}`);
      }
    });
    console.log('');
  }

  // Summary
  console.log('========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Total Checks: ${results.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Success Rate: ${((passed.length / results.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  // Categorized summary
  const categories = {
    'File Existence': results.slice(0, 5),
    'OAuth Handlers': results.slice(5, 11),
    'Auth Callback': results.slice(11, 15),
    'Onboarding Actions': results.slice(15, 21),
    'Wizard Component': results.slice(21, 29),
    'Onboarding Page': results.slice(29),
  };

  console.log('Category Breakdown:');
  for (const [category, items] of Object.entries(categories)) {
    const categoryPassed = items.filter((r) => r.passed).length;
    const status = categoryPassed === items.length ? 'PASS' : 'PARTIAL';
    console.log(`  ${status === 'PASS' ? '[OK]  ' : '[!!]  '}${category}: ${categoryPassed}/${items.length}`);
  }
  console.log('');

  // Exit code
  if (failed.length > 0) {
    console.log('Validation FAILED - some checks did not pass.\n');
    process.exit(1);
  } else {
    console.log('Validation PASSED - all checks passed successfully!\n');
    process.exit(0);
  }
}

// Run the checks
runChecks();
