const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log("BODY:", html.substring(html.indexOf('<body'), html.indexOf('</body>') + 7));
  await browser.close();
})();
