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
    console.log('Preview request received with data:', {
      party_a_ask_receiver_fill: data.party_a_ask_receiver_fill,
      party_b_ask_receiver_fill: data.party_b_ask_receiver_fill,
      party_a_name: data.party_a_name,
      party_b_name: data.party_b_name
    });
    
    // Replace empty fields with "fill here" placeholders when ask_receiver_fill is checked
    const processedData = { ...data };
    
    // Handle Party A fields
    if (data.party_a_ask_receiver_fill) {
      processedData.party_a_name = data.party_a_name || "[fill here]";
      processedData.party_a_address = data.party_a_address || "[fill here]";
      processedData.party_a_signatory_name = data.party_a_signatory_name || "[fill here]";
      processedData.party_a_title = data.party_a_title || "[fill here]";
      console.log('Party A ask receiver to fill - using placeholders');
    }
    
    // Handle Party B fields
    if (data.party_b_ask_receiver_fill) {
      processedData.party_b_name = data.party_b_name || "[fill here]";
      processedData.party_b_address = data.party_b_address || "[fill here]";
      processedData.party_b_signatory_name = data.party_b_signatory_name || "[fill here]";
      processedData.party_b_title = data.party_b_title || "[fill here]";
      processedData.party_b_email = data.party_b_email || "[fill here]";
      console.log('Party B ask receiver to fill - using placeholders');
    }
    
    console.log('Processed data for template:', {
      party_a_name: processedData.party_a_name,
      party_b_name: processedData.party_b_name
    });
    
    // Read template
    const templatePath = path.join(process.cwd(), 'templates', 'mutual-nda-v3.hbs')
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = Handlebars.compile(templateContent)
    
    // Generate HTML
    const html = template(processedData)
    console.log('HTML generated, length:', html.length);
    
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