# Template Picker Feature

## Overview
Users can now select from multiple NDA templates before creating a new NDA. This provides flexibility to choose the format and style that best fits their needs.

## User Flow

```
Dashboard → "New NDA" button → Template Selection Page (/templates) → Select Template → Fill NDA Form (/fillnda?templateId=X) → Preview PDF → Send
```

## Implementation

### 1. Template Selection Page
**Location**: `/src/app/templates/page.tsx`

**Features**:
- Beautiful card-based layout with gradient backgrounds
- Category filtering (all, mutual, one-way)
- Template preview images (or placeholder icons)
- Version badges
- Tags for quick identification
- Responsive design (mobile, tablet, desktop)
- "Use This Template" button on each card

**Navigation**:
- Clicking any template → redirects to `/fillnda?templateId={template-id}`
- Back button → returns to dashboard

### 2. Updated Fill NDA Page
**Location**: `/src/app/fillnda/page.tsx`

**Changes**:
- Added `templateId` state (defaults to `mutual-nda-v3`)
- Reads `templateId` from URL query parameter
- Passes `templateId` to preview API
- Logs template selection for debugging

**Example URLs**:
- `/fillnda?templateId=mutual-nda-v1` - Original DOCX format
- `/fillnda?templateId=mutual-nda-v3` - Comprehensive format
- `/fillnda?templateId=one-way-nda-v1` - Simple one-way NDA

### 3. Updated Navigation
**Location**: `/src/components/PrivateToolbar.tsx`

**Changes**:
- "New NDA" button now routes to `/templates` instead of `/fillnda?new=true`
- Both desktop and mobile menu updated
- User selects template first, then proceeds to form

### 4. Available Templates

#### mutual-nda-v1 (Original Format)
- **Source**: Converted from `public/pdfs/251025 Mutual NDA v1.docx`
- **Version**: 1.0
- **Created**: 2025-10-25
- **Description**: Classic mutual NDA with clean structure
- **Sections**: 15 essential sections
- **Tags**: mutual, classic, standard, business
- **Template File**: `templates/mutual-nda-v1.hbs`

#### mutual-nda-v3 (Comprehensive)
- **Version**: 3.0
- **Created**: 2025-10-30
- **Description**: Professional 15-section NDA with enhanced provisions
- **Sections**: 15 comprehensive sections with detailed clauses
- **Tags**: mutual, comprehensive, business, standard
- **Template File**: `templates/mutual-nda-v3.hbs`

#### one-way-nda-v1 (Simple)
- **Version**: 1.0
- **Created**: 2025-10-30
- **Description**: Simplified one-way NDA for vendor/consultant scenarios
- **Sections**: Basic one-way provisions
- **Tags**: one-way, simple, vendor, consultant
- **Template File**: `templates/one-way-nda-v1.hbs`

## Template Configuration

Templates are defined in `templates/template-config.json`:

```json
{
  "id": "mutual-nda-v1",
  "name": "Mutual NDA (Original Format)",
  "version": "1.0",
  "category": "mutual",
  "description": "Classic mutual non-disclosure agreement...",
  "templateFile": "mutual-nda-v1.hbs",
  "isActive": true,
  "requiredFields": [...],
  "optionalFields": [...],
  "defaultValues": {...},
  "tags": ["mutual", "classic", "standard", "business"],
  "previewImage": "/templates/previews/mutual-nda-v1.png"
}
```

## API Integration

### GET /api/templates
Returns list of all active templates with metadata.

**Response**:
```json
{
  "templates": [
    {
      "id": "mutual-nda-v1",
      "name": "Mutual NDA (Original Format)",
      "version": "1.0",
      "category": "mutual",
      "description": "...",
      "tags": ["mutual", "classic"],
      "previewImage": "/templates/previews/mutual-nda-v1.png"
    }
  ]
}
```

### POST /api/ndas/preview
Generates PDF preview using specified template.

**Request**:
```json
{
  "templateId": "mutual-nda-v1",
  "docName": "Partnership Discussion",
  "effective_date": "2025-01-15",
  ...other fields
}
```

**Response**:
```json
{
  "fileUrl": "data:application/pdf;base64,...",
  "base64": "...",
  "mime": "application/pdf",
  "filename": "nda-preview-xxxxx.pdf"
}
```

## Styling

### Template Cards
- Gradient backgrounds (blue to purple)
- Hover effects (shadow enhancement, scale transform)
- Smooth transitions (200-300ms)
- Professional typography (Tailwind CSS)
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)

### Category Filter
- Pill-shaped buttons
- Active state with gradient background
- Inactive state with white background and border
- Smooth transitions

### Empty States
- Icon + message when no templates found
- Helpful guidance to try different categories

## Adding New Templates

1. **Create Handlebars file**: `templates/your-template-v1.hbs`
2. **Add to config**: Update `templates/template-config.json`
3. **Update changelog**: Document in `templates/CHANGELOG.md`
4. **Optional**: Add preview image at `/public/templates/previews/your-template-v1.png`
5. **Test**: Navigate to `/templates` and verify card appears

## Best Practices

1. **Template IDs**: Use format `{type}-nda-v{version}` (e.g., `mutual-nda-v1`)
2. **Versions**: Increment version when making breaking changes
3. **Categories**: Stick to standard categories (mutual, one-way, specialized)
4. **Tags**: Use 3-5 descriptive tags per template
5. **Descriptions**: Keep descriptions concise (1-2 sentences)
6. **Preview Images**: 400x300px minimum, professional appearance

## User Experience

### Benefits
✅ **Choice**: Users can select the format that fits their needs  
✅ **Preview**: Visual cards help users understand template differences  
✅ **Flexibility**: Easy to add new templates without code changes  
✅ **Guided**: Clear flow from template selection to form completion  
✅ **Professional**: Beautiful UI builds trust and confidence  

### Future Enhancements
- Template preview modal (full PDF preview before selection)
- Template comparison feature (side-by-side comparison)
- User favorites/recently used templates
- Custom template builder
- Industry-specific templates (tech, healthcare, finance)

## Testing

1. **Navigate to templates page**: Click "New NDA" in toolbar
2. **Filter by category**: Click category buttons
3. **Select template**: Click "Use This Template" button
4. **Verify routing**: Confirm redirect to `/fillnda?templateId=X`
5. **Fill form**: Enter test data
6. **Generate preview**: Click preview button
7. **Verify template**: Confirm PDF uses selected template format

## Troubleshooting

**Template not appearing?**
- Check `isActive: true` in template-config.json
- Verify template file exists in `templates/` directory
- Check console for template loading errors

**Wrong template rendering?**
- Verify `templateId` in URL query parameter
- Check console logs for template selection
- Confirm template file path in config

**Preview image not showing?**
- Verify image path in config
- Check file exists in `/public/templates/previews/`
- Fallback: SVG icon displays if image missing
