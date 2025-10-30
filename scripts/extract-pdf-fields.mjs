// Extract PDF Field Names
// Usage: node scripts/extract-pdf-fields.mjs path/to/your.pdf

import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function extractFields(pdfPath) {
  try {
    console.log('📄 Reading PDF:', pdfPath);
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('\n✅ Found', fields.length, 'form fields:\n');
    
    const fieldData = [];
    
    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;
      
      console.log(`${index + 1}. ${name}`);
      console.log(`   Type: ${type}\n`);
      
      fieldData.push({
        name,
        type,
        configTemplate: {
          label: `${name.replace(/_/g, ' ')}`,
          type: type.includes('Text') ? 'text' : 'text',
          required: true,
          placeholder: `Enter ${name.replace(/_/g, ' ').toLowerCase()}`,
          pdfFieldName: name,
          section: 'general'
        }
      });
    });
    
    // Generate config template
    console.log('\n📋 Generated config template:\n');
    console.log(JSON.stringify({
      fields: Object.fromEntries(
        fieldData.map(f => [
          f.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          f.configTemplate
        ])
      )
    }, null, 2));
    
    // Save to file
    const outputPath = pdfPath.replace('.pdf', '-fields.json');
    fs.writeFileSync(outputPath, JSON.stringify(fieldData, null, 2));
    console.log('\n💾 Saved field data to:', outputPath);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('Usage: node scripts/extract-pdf-fields.mjs path/to/your.pdf');
  console.log('\nExample:');
  console.log('  node scripts/extract-pdf-fields.mjs public/pdfs/my-nda.pdf');
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error('❌ File not found:', pdfPath);
  process.exit(1);
}

extractFields(pdfPath);
