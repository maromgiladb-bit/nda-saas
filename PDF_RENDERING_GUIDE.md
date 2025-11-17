# PDF Rendering Guide - 1:1 HTML/PDF Parity

This document explains how our PDF generation achieves pixel-perfect 1:1 rendering with the HTML preview.

## Overview

The PDF generation system uses **Puppeteer** with carefully tuned settings to ensure the PDF output matches the on-screen HTML preview exactly. No more differences in colors, fonts, spacing, or layout!

## Key Components

### 1. Template CSS (`templates/professional_mutual_nda_v1.hbs`)

The template includes special CSS rules for deterministic PDF rendering:

```css
/* PDF Page Control */
@page {
  size: A4;
  margin: 0;
}

html, body {
  margin: 0;
  padding: 0;
}

/* Force exact color rendering in PDF */
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Fixed page dimensions */
.page {
  width: 210mm;              /* A4 width */
  min-height: 297mm;         /* A4 height */
  margin: 0 auto;
  padding: 24mm 20mm;        /* Inner visual margins */
  box-sizing: border-box;
}
```

**Why this matters:**
- `@page { margin: 0 }` prevents browser from adding unwanted margins
- Fixed `width: 210mm` ensures consistent layout regardless of viewport
- `print-color-adjust: exact` forces backgrounds and colors to render
- `padding` on `.page` controls visual spacing (not page margins)

### 2. PDF Generation Utility (`src/lib/htmlToPdf.ts`)

The `renderHtmlToPdf()` function:

```typescript
const pdf = await renderHtmlToPdf(html, {
  pageWidthPx: 900,      // Match your preview container width
  baseUrl: 'http://localhost:3000',
  isA4: true,
  debugScreenshot: false // Set true to save debug image
})
```

**Critical settings:**
- `pageWidthPx: 900` - Must match the width of your HTML preview container
- `emulateMediaType('print')` - Uses print media type to respect @page rules and @media print styles
- `printBackground: true` - Renders backgrounds, shadows, gradients
- `preferCSSPageSize: true` - Respects the `@page` CSS rule
- `deviceScaleFactor: 2` - High DPI for sharp text
- `margin: { top: '0', right: '0', bottom: '0', left: '0' }` - Zero margins (controlled by CSS)

### 3. API Route (`src/app/api/ndas/preview/route.ts`)

The endpoint that generates PDFs:

```typescript
const pdfBuffer = await renderHtmlToPdf(html, {
  pageWidthPx: 900,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  isA4: true,
})
```

## Achieving Perfect Parity

### Step 1: Match the Preview Width

The PDF viewport width **must match** your preview container width:

```typescript
// If your preview iframe/div is 900px wide:
pageWidthPx: 900

// If it's 850px:
pageWidthPx: 850
```

**How to find the right width:**
1. Open browser DevTools (F12)
2. Inspect the preview iframe/container
3. Note the computed width
4. Update `pageWidthPx` in the API route to match

### Step 2: Use Print Media Type

The code uses `emulateMediaType('print')` so the PDF properly respects `@page` rules and `@media print` styles. This means:
- ✅ @page CSS rules are applied (A4 size, margins)
- ✅ @media print styles take effect
- ✅ Colorful styling preserved with `printBackground: true`
- ✅ Clean page breaks and typography controls

### Step 3: Force Color Rendering

The `* { print-color-adjust: exact; }` CSS rule ensures:
- Backgrounds render (not stripped out)
- Gradient fills preserved
- Shadow effects visible
- All colors match exactly

## Debugging

### Visual Comparison

Enable debug screenshot to compare rendering:

```typescript
const pdf = await renderHtmlToPdf(html, {
  pageWidthPx: 900,
  debugScreenshot: true,  // Saves to pdf-debug.png
})
```

This creates `pdf-debug.png` showing exactly how Puppeteer sees the page before PDF conversion.

### Common Issues

**Issue**: PDF has different colors than HTML
**Fix**: Ensure `printBackground: true` and `print-color-adjust: exact` are set

**Issue**: PDF layout is different (text wrapping changes)
**Fix**: Match `pageWidthPx` to your preview container width exactly

**Issue**: Fonts look different
**Fix**: Use web-safe fonts or host custom fonts in `/public/fonts/`

**Issue**: PDF has extra margins
**Fix**: Verify `@page { margin: 0 }` is in template CSS

**Issue**: Images/assets don't load
**Fix**: Ensure `baseUrl` is set correctly and assets use absolute URLs

## Width Configuration

To change the preview/PDF width:

### Option A: Change Preview Container (Recommended)
1. Update the preview iframe/div width in `fillndahtml/page.tsx`
2. Update `pageWidthPx` in the API route to match

### Option B: Change PDF Only
1. Only update `pageWidthPx` in the API route
2. Note: This will cause PDF to differ from preview

**Best practice:** Keep both at the same width for true 1:1 parity.

## Production Deployment

The code is ready for Vercel/serverless deployment:
- Uses `puppeteer-core` + `@sparticuz/chromium` 
- Browser instance is reused for performance
- Automatically detects production vs development environment

No changes needed for deployment!

## Performance

- **Browser reuse**: Browser instance stays open between requests (faster)
- **High DPR**: `deviceScaleFactor: 2` creates sharp text with minimal size increase
- **Network idle**: Waits for all assets to load before rendering
- **Typical time**: 2-4 seconds for multi-page NDAs

## Summary

✅ **Template CSS**: Fixed dimensions + color forcing
✅ **Viewport match**: `pageWidthPx` matches preview width  
✅ **Screen media**: Uses visible styles, not print styles
✅ **Background rendering**: All colors/gradients preserved
✅ **Debug mode**: Screenshot for visual comparison

Result: **Pixel-perfect PDF that matches HTML preview exactly** 🎯
