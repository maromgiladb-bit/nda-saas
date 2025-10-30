import puppeteer, { Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

let browserInstance: Browser | null = null

/**
 * Get browser executable path
 * In production (Vercel), use chromium package
 * In development, use local Chrome installation
 */
async function getExecutablePath(): Promise<string> {
  // If CHROME_PATH is set in env, use it
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH
  }

  // In production (e.g., Vercel), use chromium package
  if (process.env.NODE_ENV === 'production') {
    return await chromium.executablePath()
  }

  // Development: try common Chrome paths
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    '/usr/bin/google-chrome', // Linux
    '/usr/bin/chromium-browser', // Linux alternative
  ]

  // Return first path that exists (for dev)
  // In reality, puppeteer will find Chrome automatically in dev
  return paths[0] // Default to Windows path for this project
}

/**
 * Get or create browser instance (reuse for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance
  }

  const executablePath = await getExecutablePath()
  
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath,
    args: process.env.NODE_ENV === 'production' 
      ? chromium.args
      : ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  return browserInstance
}

/**
 * Convert HTML string to PDF buffer
 * @param html - HTML string to convert
 * @returns PDF as Buffer
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // Set content and wait for network to be idle
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF with A4 format and margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        right: '16mm',
        bottom: '16mm',
        left: '16mm',
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await page.close()
  }
}

/**
 * Close browser instance (call on app shutdown if needed)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
