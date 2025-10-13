import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import puppeteer from 'puppeteer-core'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

const findChrome = () => {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ]
  
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Read template
    const templatePath = path.join(process.cwd(), 'templates', 'mutual-nda-v3.hbs')
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = Handlebars.compile(templateContent)
    
    // Generate HTML
    const html = template(data)
    
    // Find Chrome executable
    const chromePath = findChrome()
    if (!chromePath) {
      return NextResponse.json({ error: 'Chrome not found' }, { status: 500 })
    }

    // Generate PDF
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    })
    
    await browser.close()
    
    // Convert to base64
    const base64 = Buffer.from(pdfBuffer).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`
    
    return NextResponse.json({ fileUrl: dataUrl })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}