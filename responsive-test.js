const { chromium } = require('playwright');
const fs = require('fs');

const VIEWPORTS = {
  // Mobile
  mobile_se: { width: 320, height: 568, name: 'Mobile - iPhone SE (320px)' },
  mobile_standard: { width: 375, height: 667, name: 'Mobile - iPhone Standard (375px)' },
  mobile_14: { width: 390, height: 844, name: 'Mobile - iPhone 14 (390px)' },
  mobile_max: { width: 428, height: 926, name: 'Mobile - iPhone 14 Pro Max (428px)' },
  
  // Tablet
  tablet_mini: { width: 768, height: 1024, name: 'Tablet - iPad Mini (768px)' },
  tablet_air: { width: 820, height: 1180, name: 'Tablet - iPad Air (820px)' },
  tablet_pro: { width: 1024, height: 1366, name: 'Tablet - iPad Pro (1024px)' },
  
  // Laptop
  laptop_small: { width: 1280, height: 800, name: 'Laptop - Small (1280px)' },
  laptop_standard: { width: 1366, height: 768, name: 'Laptop - Standard (1366px)' },
  laptop_macbook: { width: 1440, height: 900, name: 'Laptop - MacBook (1440px)' },
  
  // Desktop
  desktop_hd: { width: 1536, height: 864, name: 'Desktop - HD (1536px)' },
  desktop_fhd: { width: 1920, height: 1080, name: 'Desktop - Full HD (1920px)' },
  desktop_qhd: { width: 2560, height: 1440, name: 'Desktop - QHD (2560px)' },
  
  // Ultrawide
  ultrawide: { width: 3440, height: 1440, name: 'Ultrawide (3440px)' }
};

const PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/chat', name: 'Chat' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/people', name: 'People' },
  { path: '/projects', name: 'Projects' }
];

async function runTests() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const results = [];
  const screenshotDir = './test-screenshots';
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n========== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ==========\n`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();

    for (const pageInfo of PAGES) {
      console.log(`  Testing ${pageInfo.name}...`);
      
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        await page.waitForTimeout(1000);
        
        const screenshotPath = `${screenshotDir}/${viewportKey}-${pageInfo.name.toLowerCase()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Check for layout issues
        const issues = await page.evaluate(() => {
          const problems = [];
          
          // Check for horizontal overflow
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
            problems.push('Horizontal scroll detected - content overflows viewport');
          }
          
          // Check for elements overflowing
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth + 5) {
              const className = typeof el.className === 'string' ? el.className : '';
              const tagInfo = el.tagName + (className ? '.' + className.split(' ')[0] : '');
              if (!problems.includes(`Element overflow: ${tagInfo}`)) {
                problems.push(`Element overflow: ${tagInfo}`);
              }
            }
          });
          
          // Check for text overflow/truncation issues
          const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
          textElements.forEach(el => {
            if (el.scrollWidth > el.clientWidth && getComputedStyle(el).overflow !== 'hidden') {
              const text = el.textContent.substring(0, 30);
              problems.push(`Text may be truncated: "${text}..."`);
            }
          });
          
          // Check for very small touch targets on mobile
          if (window.innerWidth < 500) {
            const clickables = document.querySelectorAll('button, a, [role="button"]');
            clickables.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                if (rect.width > 0 && rect.height > 0) {
                  const name = el.textContent?.substring(0, 20) || el.getAttribute('aria-label') || 'unnamed';
                  problems.push(`Small touch target (${Math.round(rect.width)}x${Math.round(rect.height)}): ${name}`);
                }
              }
            });
          }
          
          return problems.slice(0, 10); // Limit to 10 issues per page
        });
        
        results.push({
          viewport: viewport.name,
          page: pageInfo.name,
          screenshot: screenshotPath,
          issues: issues,
          status: issues.length === 0 ? '✅ PASS' : '⚠️ ISSUES'
        });
        
        console.log(`    ${issues.length === 0 ? '✅ PASS' : '⚠️ ' + issues.length + ' issues found'}`);
        if (issues.length > 0) {
          issues.forEach(issue => console.log(`      - ${issue}`));
        }
        
      } catch (error) {
        results.push({
          viewport: viewport.name,
          page: pageInfo.name,
          screenshot: null,
          issues: [`Error: ${error.message}`],
          status: '❌ ERROR'
        });
        console.log(`    ❌ ERROR: ${error.message}`);
      }
    }
    
    await context.close();
  }

  // Generate report
  console.log('\n\n========================================');
  console.log('       RESPONSIVENESS TEST REPORT');
  console.log('========================================\n');
  
  for (const viewport of Object.values(VIEWPORTS)) {
    console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log('─'.repeat(40));
    
    const viewportResults = results.filter(r => r.viewport === viewport.name);
    viewportResults.forEach(r => {
      console.log(`  ${r.status} ${r.page}`);
      if (r.issues.length > 0) {
        r.issues.forEach(issue => console.log(`      └─ ${issue}`));
      }
    });
  }
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const passCount = results.filter(r => r.issues.length === 0).length;
  
  console.log('\n========================================');
  console.log(`Summary: ${passCount}/${results.length} pages passed`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Screenshots saved to: ${screenshotDir}/`);
  console.log('========================================\n');

  await browser.close();
}

runTests().catch(console.error);

