const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/paid-ebooks');
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log("BODY:", html.substring(html.indexOf('<body'), html.indexOf('</body>') + 7));
  await browser.close();
})();
