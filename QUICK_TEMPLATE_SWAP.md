# Quick Template Swap Guide 🚀

## 3-Minute Template Replacement

### 1️⃣ Copy Your PDF
```bash
cp "your-new-nda.pdf" "public/pdfs/your-nda.pdf"
```

### 2️⃣ Edit Config
Open `templates/nda-config.json` and update:

```json
{
  "templateFile": "your-nda.pdf",  // ← Change this
  "templateName": "Your NDA Name",
  "fields": {
    "field_key": {
      "label": "Field Label",
      "type": "text",
      "required": true,
      "pdfFieldName": "PDF_FIELD_NAME",  // ← Must match PDF exactly
      "section": "section_name"
    }
  }
}
```

### 3️⃣ Test
```bash
npm run dev
# Visit http://localhost:3000/fillnda
# Fill form → Preview PDF → Verify fields
```

## Finding PDF Field Names

```bash
# Method 1: Open in Adobe Acrobat
# - Click "Prepare Form"
# - Hover over fields to see names

# Method 2: Use Node.js
node -e "
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
(async () => {
  const pdf = await PDFDocument.load(
    fs.readFileSync('public/pdfs/your-nda.pdf')
  );
  const form = pdf.getForm();
  const fields = form.getFields();
  fields.forEach(f => console.log('📝', f.getName()));
})();
"
```

## Field Types Reference

| Type | Input | Example |
|------|-------|---------|
| `"text"` | Text box | Company name, address |
| `"date"` | Date picker | Effective date, signature date |
| `"email"` | Email input | Contact email |
| `"number"` | Number input | Term in months |

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Fields not filling | Check `pdfFieldName` matches PDF exactly (case-sensitive) |
| Template not found | Verify PDF exists in `/public/pdfs/` |
| Validation errors | Set `required: false` for optional fields |
| Wrong field order | Adjust section `order` values |

## Complete Example

**Before** (old NDA):
```json
{
  "templateFile": "old-nda.pdf",
  "fields": {
    "company": {
      "pdfFieldName": "CompanyName",
      ...
    }
  }
}
```

**After** (new NDA):
```json
{
  "templateFile": "new-nda-2025.pdf",
  "fields": {
    "company": {
      "pdfFieldName": "Company_Legal_Name",  // ← Updated
      ...
    }
  }
}
```

**Deploy**:
```bash
git add templates/nda-config.json public/pdfs/new-nda-2025.pdf
git commit -m "Update to NDA 2025 template"
git push
```

## Done! ✅

Your new template is now live. Users will automatically use the new NDA when filling forms.

---

**Need help?** See `TEMPLATE_SYSTEM_GUIDE.md` for detailed documentation.
