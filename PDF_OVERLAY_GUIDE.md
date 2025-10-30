# PDF Text Overlay Guide

## Overview

Your NDA PDF doesn't have fillable form fields - it only has highlighted text areas. This guide explains how to fill it using **text overlay mode**.

## Two Approaches

### ✅ Recommended: Convert to Fillable Form

**Best option** - Makes the PDF truly fillable and easier to maintain:

1. Open `251025-nir-mutual-nda-v1.pdf` in **Adobe Acrobat Pro**
2. Go to **Tools → Prepare Form**
3. Click **Auto-detect form fields** (or manually add fields)
4. Place form fields over each highlighted area
5. Name each field to match the config (see field names below)
6. Save the PDF

**Field Names to Use:**
- `party_a_company_name`
- `party_a_address`
- `party_a_signatory_name`
- `party_a_title`
- `party_a_date`
- `party_b_company_name`
- `party_b_address`
- `party_b_signatory_name`
- `party_b_title`
- `party_b_date`
- `effective_date`

7. Update `templates/nda-config.json`:
   - Change `"fillMode": "overlay"` to `"fillMode": "formFields"`
   - Replace `pdfPosition` with `pdfFieldName` for each field

**Done!** No coordinate calculations needed.

---

### 🔧 Alternative: Text Overlay (Current Setup)

Use this if you can't modify the PDF. Text is drawn directly on the page at specific coordinates.

#### PDF Specifications
- **Pages**: 4
- **Size**: 595.32 x 841.92 points (A4)
- **Coordinate System**: Origin (0,0) at bottom-left corner
  - X: left (0) → right (595.32)
  - Y: bottom (0) → up (841.92)

#### Current Field Positions

The config has placeholder positions. You need to adjust them:

```json
{
  "party_a_company_name": { "page": 0, "x": 150, "y": 750 },
  "party_a_address": { "page": 0, "x": 150, "y": 730 },
  "effective_date": { "page": 0, "x": 150, "y": 700 },
  "party_b_company_name": { "page": 0, "x": 150, "y": 680 },
  "party_b_address": { "page": 0, "x": 150, "y": 660 },
  
  "party_a_signatory_name": { "page": 2, "x": 150, "y": 200 },
  "party_a_title": { "page": 2, "x": 150, "y": 180 },
  "party_a_date": { "page": 2, "x": 400, "y": 200 },
  
  "party_b_signatory_name": { "page": 2, "x": 150, "y": 100 },
  "party_b_title": { "page": 2, "x": 150, "y": 80 },
  "party_b_date": { "page": 2, "x": 400, "y": 100 }
}
```

#### How to Find Exact Positions

**Method 1: Trial & Error** (Quick & Easy)

1. Go to `/fillnda` page
2. Fill out the form with test data
3. Preview the PDF
4. Note where text appears vs where it should be
5. Adjust coordinates in `templates/nda-config.json`
6. Repeat until aligned

**Tips:**
- If text is too low, increase Y value
- If text is too high, decrease Y value
- If text is too far left, increase X value
- If text is too far right, decrease X value

**Method 2: Measure in PDF** (More Precise)

1. Run: `node scripts/find-text-positions.mjs "public/pdfs/251025-nir-mutual-nda-v1.pdf"`
2. View page dimensions and suggested positions
3. Open PDF in viewer, hover over highlighted areas
4. Note rough coordinates
5. Add to config and test

**Method 3: Manual Calculation**

For reference positions (standard A4 @ 595.32 x 841.92):
- **Top section**: y: 700-800 (party names, addresses, dates)
- **Signature section** (page 3, index 2): y: 100-250
- **Left margin**: x: 72-150 (1-2 inches from left)
- **Date fields**: x: 400+ (right side)

## Configuration Reference

### Current Config Location
`templates/nda-config.json`

### Field Structure (Overlay Mode)
```json
{
  "field_name": {
    "label": "Display Name",
    "type": "text|date|number",
    "required": true,
    "placeholder": "Hint text",
    "section": "party_a|party_b|document",
    "pdfPosition": {
      "page": 0,  // 0-based index (0 = first page)
      "x": 150,   // Points from left edge
      "y": 750    // Points from bottom edge
    }
  }
}
```

### Important Notes

1. **Page numbering**: 0-based (page 0 = first page)
2. **Coordinates**: Bottom-left origin (unlike Adobe's top-left)
3. **Font size**: Fixed at 10pt (can be adjusted in code if needed)
4. **Color**: Black text (rgb(0, 0, 0))

## Testing Your Configuration

1. Start the dev server: `npm run dev`
2. Navigate to `/fillnda`
3. Fill the form with test data:
   - Use long names to test text wrapping
   - Try different date formats
   - Check all required fields
4. Click "Preview PDF"
5. Verify text appears in highlighted areas
6. Adjust coordinates in `nda-config.json` as needed
7. Refresh and test again

## Code Locations

- **Template Config**: `templates/nda-config.json`
- **Fill API**: `src/app/api/ndas/fill-template/route.ts`
- **Template Manager**: `src/lib/template-manager.ts`
- **Frontend Form**: `src/app/fillnda/page.tsx`
- **Helper Scripts**: `scripts/find-text-positions.mjs`, `scripts/extract-pdf-fields.mjs`

## Switching Between Modes

**From Overlay → Form Fields:**
1. Create fillable PDF (see recommended approach above)
2. Change `"fillMode": "overlay"` to `"fillMode": "formFields"`
3. Replace all `pdfPosition` with `pdfFieldName` in config
4. Done!

**From Form Fields → Overlay:**
1. Change `"fillMode": "formFields"` to `"fillMode": "overlay"`
2. Replace all `pdfFieldName` with `pdfPosition` objects
3. Use helper script to find coordinates
4. Test and adjust

## Need Help?

Run the position finder script:
```bash
node scripts/find-text-positions.mjs "public/pdfs/251025-nir-mutual-nda-v1.pdf"
```

This shows:
- Page dimensions
- Common position reference points
- Suggested coordinates for different sections
- Conversion formulas

---

**Status**: Text overlay mode is fully implemented and ready to use. Adjust coordinates in `templates/nda-config.json` to match your PDF's highlighted areas, or convert the PDF to a fillable form for easier maintenance.
