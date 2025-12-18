const { chromium } = require('playwright');

const VIEWPORTS = {
  // Mobile
  mobile_se: { width: 320, height: 568, name: 'Mobile - iPhone SE (320px)' },
  mobile_standard: { width: 375, height: 667, name: 'Mobile - iPhone Standard (375px)' },
  mobile_14: { width: 390, height: 844, name: 'Mobile - iPhone 14 (390px)' },
  mobile_max: { width: 428, height: 926, name: 'Mobile - iPhone 14 Pro Max (428px)' },
  
  // Tablet
  tablet_mini: { width: 768, height: 1024, name: 'Tablet - iPad Mini (768px)' },
  tablet_air: { width: 820, height: 1180, name: 'Tablet - iPad Air (820px)' },
};

const PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/chat', name: 'Chat' },
  { path: '/people', name: 'People' },
  { path: '/projects', name: 'Projects' }
];

async function finalTest() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  console.log('\n🔍 FINAL COMPREHENSIVE TEST - All Devices Below 1024px\n');
  console.log('='.repeat(60));

  for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n📱 ${viewport.name}`);
    console.log('─'.repeat(60));
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();

    for (const pageInfo of PAGES) {
      totalTests++;
      
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        await page.waitForTimeout(1000);

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasHorizontalScroll) {
          console.log(`  ❌ ${pageInfo.name}: Horizontal scroll detected`);
          results.push({ viewport: viewport.name, page: pageInfo.name, status: 'FAIL' });
        } else {
          console.log(`  ✅ ${pageInfo.name}: No horizontal scroll`);
          results.push({ viewport: viewport.name, page: pageInfo.name, status: 'PASS' });
          passedTests++;
        }

      } catch (error) {
        console.log(`  ❌ ${pageInfo.name}: Error - ${error.message}`);
        results.push({ viewport: viewport.name, page: pageInfo.name, status: 'ERROR' });
      }
    }
    
    await context.close();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your app is fully responsive below 1024px!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  console.log('='.repeat(60) + '\n');

  await browser.close();
}

finalTest().catch(console.error);



