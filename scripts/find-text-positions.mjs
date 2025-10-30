/**
 * PDF Text Position Finder
 * 
 * This script helps you find the exact coordinates for text overlay in PDFs
 * 
 * Usage:
 *   node scripts/find-text-positions.mjs "path/to/pdf.pdf"
 * 
 * Output:
 *   - Page dimensions and information
 *   - Suggestions for common positions
 *   - Tips for finding exact coordinates
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

async function findTextPositions(pdfPath) {
  try {
    console.log(`\n📄 Analyzing PDF: ${pdfPath}\n`);
    
    // Load PDF
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pages = pdfDoc.getPages();
    console.log(`📊 Total Pages: ${pages.length}\n`);
    
    // Analyze each page
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      console.log(`\n━━━ Page ${index + 1} ━━━`);
      console.log(`📐 Dimensions: ${width} x ${height} points`);
      console.log(`📏 Width: ${width}pt (${(width / 72).toFixed(2)} inches)`);
      console.log(`📏 Height: ${height}pt (${(height / 72).toFixed(2)} inches)`);
      
      console.log(`\n💡 Coordinate System:`);
      console.log(`   Origin (0,0) is at BOTTOM-LEFT corner`);
      console.log(`   X increases → right (0 to ${width})`);
      console.log(`   Y increases ↑ up (0 to ${height})`);
      
      console.log(`\n📍 Common Position Reference Points:`);
      console.log(`   Top-Left:     x: 50,  y: ${height - 50}`);
      console.log(`   Top-Center:   x: ${width/2}, y: ${height - 50}`);
      console.log(`   Top-Right:    x: ${width - 50}, y: ${height - 50}`);
      console.log(`   Middle-Left:  x: 50,  y: ${height/2}`);
      console.log(`   Center:       x: ${width/2}, y: ${height/2}`);
      console.log(`   Middle-Right: x: ${width - 50}, y: ${height/2}`);
      console.log(`   Bottom-Left:  x: 50,  y: 50`);
      console.log(`   Bottom-Center: x: ${width/2}, y: 50`);
      console.log(`   Bottom-Right: x: ${width - 50}, y: 50`);
      
      console.log(`\n📝 Suggested Field Positions (page ${index}):`);
      console.log(`   Header fields:    y: ${Math.round(height - 100)} to ${Math.round(height - 200)}`);
      console.log(`   Body fields:      y: ${Math.round(height/2 - 100)} to ${Math.round(height/2 + 100)}`);
      console.log(`   Signature fields: y: 100 to 200`);
      console.log(`   Left margin:      x: 72 (1 inch)`);
      console.log(`   Center text:      x: ${Math.round(width/2)}`);
    });
    
    console.log(`\n\n🎯 HOW TO FIND EXACT COORDINATES:\n`);
    console.log(`Method 1: Trial and Error`);
    console.log(`  1. Start with estimated coordinates (use suggestions above)`);
    console.log(`  2. Fill the PDF with test data`);
    console.log(`  3. Open the filled PDF and see where text appears`);
    console.log(`  4. Adjust coordinates in nda-config.json`);
    console.log(`  5. Repeat until aligned\n`);
    
    console.log(`Method 2: Visual PDF Editor`);
    console.log(`  1. Open PDF in Adobe Acrobat or similar`);
    console.log(`  2. Use measurement tools to find coordinates`);
    console.log(`  3. Note: Some tools measure from top-left, so convert:`);
    console.log(`     y_bottom_origin = page_height - y_top_origin\n`);
    
    console.log(`Method 3: Convert to Fillable Form (Recommended)`);
    console.log(`  1. Open PDF in Adobe Acrobat Pro`);
    console.log(`  2. Tools → Prepare Form → Auto-detect fields`);
    console.log(`  3. Manually add/adjust form fields over highlighted areas`);
    console.log(`  4. Name fields to match your config`);
    console.log(`  5. Save as fillable PDF`);
    console.log(`  6. Change fillMode to 'formFields' in nda-config.json`);
    console.log(`  7. No coordinates needed! 🎉\n`);
    
    console.log(`\n💾 Example Config Entry:\n`);
    console.log(`  "party_a_company_name": {`);
    console.log(`    "label": "Party A - Company Name",`);
    console.log(`    "type": "text",`);
    console.log(`    "required": true,`);
    console.log(`    "section": "party_a",`);
    console.log(`    "pdfPosition": { "page": 0, "x": 72, "y": ${Math.round(pages[0].getSize().height - 150)} }`);
    console.log(`  }\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get PDF path from command line
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('Usage: node scripts/find-text-positions.mjs <path-to-pdf>');
  console.log('Example: node scripts/find-text-positions.mjs "public/pdfs/my-nda.pdf"');
  process.exit(1);
}

findTextPositions(pdfPath);
