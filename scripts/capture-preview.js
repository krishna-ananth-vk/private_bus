import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  console.log('Starting dev server...');
  const server = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    shell: true
  });

  // Wait 3 seconds for the server to spin up
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Launching headless browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to standard OpenGraph size
  await page.setViewportSize({ width: 1200, height: 630 });
  
  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  } catch (e) {
    console.warn('Network idle timeout or error, proceeding anyway...', e.message);
  }
  
  // Wait 5 seconds for any UI animations or loading text to settle
  console.log('Waiting 5s for UI to settle...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Taking screenshot...');
  const pngPath = path.resolve(__dirname, '../public/meta-bg.png');
  await page.screenshot({ path: pngPath });

  console.log('Closing browser...');
  await browser.close();

  // Run sips to compress to preview.jpg
  console.log('Optimizing image with sips...');
  try {
    const jpgPath = path.resolve(__dirname, '../public/preview.jpg');
    execSync(`sips -Z 1200 -s format jpeg -s formatOptions 70 "${pngPath}" --out "${jpgPath}"`);
    console.log('✅ Successfully generated public/meta-bg.png and public/preview.jpg!');
  } catch (err) {
    console.error('Error running sips:', err.message);
  }

  // Kill the dev server
  console.log('Cleaning up server...');
  server.kill();
  process.exit(0);
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
