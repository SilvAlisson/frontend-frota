const { chromium } = require('playwright');
const fs = require('fs');

async function runLoopTest() {
  const browser = await chromium.launch({ headless: true }); // Mostrar o navegador
  const context = await browser.newContext();
  const page = await context.newPage();
  
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots');
  }

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Error]: ${msg.text()}`);
    }
  });

  console.log("Iniciando Teste em Looping Infinito...");
  
  // 1. Fazer Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'alisson.araujo@klinambiental.com.br');
  await page.fill('input[type="password"]', 'Alisson#2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000); 

  console.log("Login concluído. Iniciando o Loop...");

  // 2. Loop por 5 ciclos
  for (let cycle = 1; cycle <= 5; cycle++) {
    console.log(`--- Iniciando Ciclo ${cycle}/5 ---`);
    
    const rotas = [
      { nome: "Dashboard", url: "http://localhost:5173/" },
      { nome: "Integrantes", url: "http://localhost:5173/integrantes" },
      { nome: "Cargos", url: "http://localhost:5173/cargos" },
      { nome: "Veículos", url: "http://localhost:5173/veiculos" },
      { nome: "Abastecimentos", url: "http://localhost:5173/abastecimentos" },
      { nome: "Manutenções", url: "http://localhost:5173/manutencoes" }
    ];

    for (const rota of rotas) {
      console.log(`Navegando para: ${rota.nome}`);
      await page.goto(rota.url);
      await page.waitForTimeout(3000); // Aguarda renderizar
      
      // Salva uma evidência do ciclo atual
      await page.screenshot({ path: `screenshots/loop_${rota.nome}_ciclo${cycle}.png` });
      
      // Simula uma pequena interação se quiser (scroll)
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }
    
    console.log(`--- Fim do Ciclo ${cycle}/5 ---\n`);
  }
  
  console.log("Teste de Loop Finalizado com Sucesso após 5 Ciclos!");
  await browser.close();
}

runLoopTest().catch(console.error);
