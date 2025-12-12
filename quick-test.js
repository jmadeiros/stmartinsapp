const { chromium } = require('playwright');

const VIEWPORTS = {
  mobile: { width: 390, height: 844, name: 'Mobile (390px)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768px)' },
};

async function quickTest() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });

  const PAGES = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/chat', name: 'Chat' },
    { path: '/people', name: 'People' },
    { path: '/projects', name: 'Projects' },
  ];

  console.log('\n🔍 Quick Testing All Pages in Chrome...\n');

  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n📱 ${viewport.name}`);
    console.log('─'.repeat(40));
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();

    for (const pageInfo of PAGES) {
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
          console.log(`  ❌ ${pageInfo.name}: Horizontal scroll STILL EXISTS`);
        } else {
          console.log(`  ✅ ${pageInfo.name}: No horizontal scroll - FIXED!`);
        }

        await page.screenshot({ 
          path: `./test-screenshots/quick-${key}-${pageInfo.name.toLowerCase()}.png`, 
          fullPage: true 
        });

      } catch (error) {
        console.log(`  ❌ ${pageInfo.name} Error: ${error.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Quick test complete!\n');
}

quickTest().catch(console.error);

