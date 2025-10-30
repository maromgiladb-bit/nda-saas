import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = process.argv[2] || path.join(__dirname, '../public/pdfs/251025 Mutual NDA v1.docx');

console.log('Reading DOCX file:', docxPath);

const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);

// Extract the main document XML
const documentXml = zip.file('word/document.xml').asText();

// Find all placeholders in the format {{placeholder}} or {placeholder}
const placeholderRegex = /\{+([^}]+)\}+/g;
const matches = [...documentXml.matchAll(placeholderRegex)];

const uniquePlaceholders = new Set();
matches.forEach(match => {
  const placeholder = match[1].trim();
  uniquePlaceholders.add(placeholder);
});

console.log('\n📋 Found placeholders in DOCX:');
console.log('================================');
Array.from(uniquePlaceholders).sort().forEach(p => {
  console.log(`  {{${p}}}`);
});
console.log(`\nTotal: ${uniquePlaceholders.size} unique placeholders`);
