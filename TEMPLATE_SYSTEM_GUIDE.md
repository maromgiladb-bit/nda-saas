# NDA Template System - User Guide

## Overview

The NDA SaaS app now uses a **flexible template system** that makes it easy to swap NDA templates without changing code. All template configuration is managed through JSON files.

**✨ New**: The system supports **two fill modes**:
1. **Form Fields Mode** - For PDFs with fillable form fields (recommended)
2. **Text Overlay Mode** - For static PDFs without form fields (requires coordinate mapping)

## Current Template

- **Name**: Mutual NDA v1 (251025 Nir)
- **File**: `251025-nir-mutual-nda-v1.pdf`
- **Location**: `/public/pdfs/251025-nir-mutual-nda-v1.pdf`
- **Config**: `/templates/nda-config.json`
- **Mode**: Text Overlay (PDF has no form fields)

> 📝 **Note**: The current PDF uses text overlay mode. See `PDF_OVERLAY_GUIDE.md` for coordinate adjustment instructions, or convert the PDF to a fillable form for easier maintenance.

## How It Works

### 1. Template Configuration (`templates/nda-config.json`)

This JSON file defines:
- **Template metadata** (name, version, description)
- **Fillable fields** (what data to collect from users)
- **PDF field mapping** (how form data maps to PDF fields)
- **Sections** (how to organize the form UI)

### 2. Template Manager (`src/lib/template-manager.ts`)

A utility class that:
- Loads template configuration
- Validates user input
- Maps form data to PDF fields
- Provides template metadata to the frontend

### 3. PDF Filling API (`/api/ndas/fill-template`)

An endpoint that:
- Accepts form data from the frontend
- Validates against template config
- Fills PDF using pdf-lib
- Returns filled PDF as base64

### 4. Frontend Integration (`src/app/fillnda/page.tsx`)

The form page:
- Collects user data
- Sends to fill-template API
- Displays PDF preview
- Allows sending for signature

## How to Replace the NDA Template

### Step 1: Prepare Your New PDF

1. Create or obtain your new NDA PDF
2. Ensure it has **fillable form fields** (created in Adobe Acrobat or similar)
3. Note the exact names of all fillable fields

**To check field names:**
```bash
# Using pdf-lib in Node.js
node -e "const fs = require('fs'); const { PDFDocument } = require('pdf-lib'); (async () => { const pdf = await PDFDocument.load(fs.readFileSync('your-nda.pdf')); const form = pdf.getForm(); const fields = form.getFields(); fields.forEach(f => console.log(f.getName())); })();"
```

### Step 2: Copy PDF to Public Directory

```bash
# Copy your PDF
cp "path/to/your-nda.pdf" "public/pdfs/my-new-nda.pdf"
```

### Step 3: Update Template Configuration

Edit `templates/nda-config.json`:

```json
{
  "version": "2.0",
  "templateName": "My New NDA Template",
  "templateFile": "my-new-nda.pdf",
  "description": "Updated NDA template with new terms",
  "fields": {
    "company_name": {
      "label": "Company Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter company name",
      "pdfFieldName": "CompanyName",  // ← PDF field name
      "section": "company_info"
    },
    "address": {
      "label": "Company Address",
      "type": "text",
      "required": true,
      "placeholder": "Enter address",
      "pdfFieldName": "Address",
      "section": "company_info"
    },
    // Add more fields as needed
  },
  "sections": {
    "company_info": {
      "title": "Company Information",
      "order": 1
    },
    // Add more sections as needed
  }
}
```

### Step 4: Test the New Template

```bash
# Start the dev server
npm run dev

# Open http://localhost:3000/fillnda
# Fill out the form
# Click "Preview PDF"
# Verify all fields are filled correctly
```

### Step 5: Verify Field Mapping

If some fields aren't filling:

1. **Check PDF field names** - They must match exactly
2. **Check field types** - Some PDFs have checkboxes, dropdowns, etc.
3. **Update the mapping** in `nda-config.json`

## Field Configuration Options

### Field Types

```json
"type": "text"      // Single-line text input
"type": "date"      // Date picker
"type": "email"     // Email input with validation
"type": "number"    // Number input
```

### Field Properties

```json
{
  "label": "Display name for the form",
  "type": "text",
  "required": true,                    // Makes field mandatory
  "placeholder": "Help text for user",
  "pdfFieldName": "PDF_Field_Name",    // Must match PDF exactly
  "section": "section_key"             // Groups fields together
}
```

## Section Configuration

Sections organize the form into logical groups:

```json
"sections": {
  "document_info": {
    "title": "Document Information",
    "order": 1                // Display order
  },
  "party_details": {
    "title": "Party Details",
    "order": 2
  }
}
```

## Common Scenarios

### Adding a New Field

1. Open `templates/nda-config.json`
2. Add field definition:
```json
"new_field_name": {
  "label": "New Field Label",
  "type": "text",
  "required": false,
  "pdfFieldName": "PDFFieldName",
  "section": "existing_section"
}
```
3. Restart server
4. Test in browser

### Removing a Field

1. Delete the field from `fields` object in config
2. Restart server
3. Old saved drafts with that field will simply ignore it

### Changing Field Order

Adjust the `order` property in sections:

```json
"sections": {
  "section_1": { "title": "First", "order": 1 },
  "section_2": { "title": "Second", "order": 2 },
  "section_3": { "title": "Third", "order": 3 }
}
```

### Supporting Multiple Templates

To support multiple templates simultaneously:

1. Create separate config files:
   - `nda-config-mutual.json`
   - `nda-config-one-way.json`
2. Update template manager to accept config parameter
3. Add template selection to frontend

## Troubleshooting

### Fields Not Filling

**Problem**: PDF preview shows empty fields

**Solution**:
1. Check PDF field names: They must match `pdfFieldName` exactly
2. Verify PDF has form fields (not just highlighted text)
3. Check console for errors

### Invalid PDF Error

**Problem**: "Template not found" error

**Solution**:
1. Verify PDF exists in `/public/pdfs/`
2. Check `templateFile` name in config matches exactly
3. Check file permissions

### Validation Errors

**Problem**: Form won't submit due to validation

**Solution**:
1. Check which fields are marked `required: true`
2. Ensure all required fields have values
3. Check browser console for specific errors

## API Reference

### GET `/api/ndas/template-config`

Returns current template configuration for the frontend.

**Response**:
```json
{
  "metadata": {
    "name": "Template Name",
    "version": "1.0",
    "description": "..."
  },
  "sections": [...],
  "fields": {...},
  "fieldsBySection": {...}
}
```

### POST `/api/ndas/fill-template`

Fills PDF template with provided data.

**Request Body**:
```json
{
  "field_name": "value",
  "another_field": "another value"
}
```

**Response**:
```json
{
  "fileUrl": "data:application/pdf;base64,...",
  "metadata": {
    "template": "Template Name",
    "fieldsF": 10,
    "totalFields": 12
  }
}
```

## Best Practices

1. **Always backup** old config before making changes
2. **Test thoroughly** after swapping templates
3. **Document field mappings** in comments
4. **Version your configs** (use git)
5. **Keep PDFs organized** with clear naming

## Example: Complete Template Swap

```bash
# 1. Backup current config
cp templates/nda-config.json templates/nda-config-backup.json

# 2. Copy new PDF
cp ~/Downloads/new-nda.pdf public/pdfs/new-nda-v2.pdf

# 3. Edit templates/nda-config.json
# - Update templateFile to "new-nda-v2.pdf"
# - Update fields to match new PDF
# - Update metadata (name, version, description)

# 4. Restart server
npm run dev

# 5. Test
# - Go to /fillnda
# - Fill form
# - Preview PDF
# - Verify all fields filled correctly

# 6. Deploy
git add templates/nda-config.json public/pdfs/new-nda-v2.pdf
git commit -m "Update NDA template to v2"
git push
```

## Support

If you encounter issues:

1. Check console logs (browser and server)
2. Verify PDF field names match config
3. Test with minimal data first
4. Review this guide's troubleshooting section

## Files Changed in This Implementation

- ✅ `/templates/nda-config.json` - Template configuration
- ✅ `/src/lib/template-manager.ts` - Template management utility
- ✅ `/src/app/api/ndas/fill-template/route.ts` - PDF filling API
- ✅ `/src/app/api/ndas/template-config/route.ts` - Config API
- ✅ `/src/app/fillnda/page.tsx` - Updated to use new system
- ✅ `/public/pdfs/251025-nir-mutual-nda-v1.pdf` - Current template

## Next Steps

To fully integrate the template system:

1. **Update frontend form** to dynamically render based on config
2. **Add template selector** if supporting multiple templates
3. **Migrate old data** to new field names if needed
4. **Update documentation** with your specific field mappings
