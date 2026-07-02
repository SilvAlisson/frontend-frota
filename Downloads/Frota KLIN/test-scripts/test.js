const { chromium } = require('playwright');
const fs = require('fs');

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots');
  }

  // 1. Test Admin Login
  console.log("Testing Admin Login...");
  let page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  
  // Tratar erros de console na página para detectar quebras
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Admin] Browser Error: ${msg.text()}`);
    }
  });

  await page.fill('input[type="email"]', 'alisson.araujo@klinambiental.com.br');
  await page.fill('input[type="password"]', 'Alisson#2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000); // Espera carregar dashboard
  await page.screenshot({ path: 'screenshots/admin-dashboard.png', fullPage: true });
  console.log("Admin Dashboard screenshot salvo!");
  await page.close();

  // 2. Test RH Login
  console.log("\nTesting RH Login...");
  page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[RH] Browser Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'weslley.santos@klinambiental.com.br');
  await page.fill('input[type="password"]', 'Klin#2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/rh-dashboard.png', fullPage: true });
  console.log("RH Dashboard screenshot salvo!");
  await page.close();

  // 3. Test Encarregado Login
  console.log("\nTesting Encarregado Magic Token...");
  page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Encarregado] Browser Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/login?magicToken=1469');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/encarregado-dashboard.png', fullPage: true });
  console.log("Encarregado Dashboard screenshot salvo!");
  await page.close();

  // 4. Test Operador Login
  console.log("\nTesting Operador Magic Token...");
  page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Operador] Browser Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/login?magicToken=1243');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/operador-dashboard.png', fullPage: true });
  console.log("Operador Dashboard screenshot salvo!");
  await page.close();

  console.log("\nAll tests finished! Screenshots salvos na pasta 'screenshots'.");
  await browser.close();
}

runTests().catch(console.error);
