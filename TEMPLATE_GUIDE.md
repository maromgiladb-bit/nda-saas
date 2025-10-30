# NDA Template System

This system allows you to easily manage multiple NDA templates with different versions, layouts, and field requirements.

## 📁 File Structure

```
templates/
├── template-config.json     # Central configuration for all templates
├── mutual-nda-v3.hbs        # Handlebars template file
├── mutual-nda-v4.hbs        # Future versions...
├── one-way-nda-v1.hbs       # Different template types
└── previews/                # Template preview images (optional)
    ├── mutual-nda-v3.png
    └── one-way-nda-v1.png
```

## 🚀 Adding a New Template

### Step 1: Create the Handlebars Template

Create a new `.hbs` file in the `templates/` directory:

```bash
templates/mutual-nda-v4.hbs
```

Use Handlebars syntax for dynamic fields:
```html
<p>This agreement is between <strong>{{party_a_name}}</strong> and <strong>{{party_b_name}}</strong>.</p>
```

**Available Handlebars Helpers:**
- `{{fieldName}}` - Insert field value
- `{{#if fieldName}}...{{/if}}` - Conditional content
- `{{#unless fieldName}}...{{/unless}}` - Inverse conditional
- `{{#each items}}...{{/each}}` - Loop over arrays

### Step 2: Add Configuration to template-config.json

Add your template to the `templates` array:

```json
{
  "id": "mutual-nda-v4",
  "name": "Mutual NDA (Simple)",
  "version": "4.0",
  "category": "mutual",
  "description": "Simplified mutual NDA for quick agreements",
  "templateFile": "mutual-nda-v4.hbs",
  "isActive": true,
  "requiredFields": [
    "effective_date",
    "party_a_name",
    "party_b_name",
    "term_months"
  ],
  "optionalFields": [
    "party_a_email",
    "party_b_email",
    "confidentiality_period_months"
  ],
  "defaultValues": {
    "term_months": "12",
    "governing_law": "California"
  },
  "tags": ["mutual", "simple", "quick"]
}
```

### Step 3: Define Any New Fields

If your template uses new fields not in `fieldDefinitions`, add them:

```json
"fieldDefinitions": {
  "new_field_name": {
    "label": "New Field Label",
    "type": "text",
    "description": "Description for the form"
  }
}
```

**Available Field Types:**
- `text` - Single line text input
- `email` - Email input with validation
- `tel` - Phone number input
- `date` - Date picker
- `number` - Numeric input
- `textarea` - Multi-line text input

### Step 4: Test Your Template

Use the API to render your template:

```bash
# List all templates
curl http://localhost:3001/api/templates

# Get specific template details
curl http://localhost:3001/api/templates?id=mutual-nda-v4

# Preview template (in fillnda page)
# Select your template from the dropdown
```

## 📝 Template Categories

- **`mutual`** - Mutual NDAs (both parties protect information)
- **`one-way`** - One-way NDAs (one party discloses, other protects)
- **`custom`** - Custom templates for specific use cases

## 🎨 Styling Guidelines

### CSS in Templates

Use inline `<style>` tags in your template for PDF generation:

```html
<style>
  @page {
    size: A4;
    margin: 2.54cm;  /* Standard 1 inch margins */
  }
  body {
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 11pt;
    line-height: 1.15;
  }
  h1 { font-size: 14pt; font-weight: bold; }
  p { text-align: justify; margin: 10pt 0; }
  strong { font-weight: bold; }
</style>
```

### Best Practices

1. **Use web-safe fonts**: Calibri, Arial, Times New Roman, Courier
2. **Set page size**: Use `@page { size: A4; }` or `Letter`
3. **Proper margins**: Standard margins are 2.54cm (1 inch)
4. **Line height**: 1.15 for single-space, 1.5 for readable text
5. **Print backgrounds**: Set `printBackground: true` (already configured in htmlToPdf)

## 🔧 Using Templates in Code

### Backend (API Routes)

```typescript
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import { htmlToPdf } from '@/lib/htmlToPdf';

// Render specific template
const html = await renderNdaHtml(formData, 'mutual-nda-v4');
const pdfBuffer = await htmlToPdf(html);
```

### Get Template Information

```typescript
import { 
  getActiveTemplates, 
  getTemplateById,
  getTemplateFields,
  validateTemplateData 
} from '@/lib/templateManager';

// List all active templates
const templates = getActiveTemplates();

// Get specific template
const template = getTemplateById('mutual-nda-v4');

// Get field definitions
const { required, optional } = getTemplateFields('mutual-nda-v4');

// Validate data
const { isValid, errors } = validateTemplateData('mutual-nda-v4', formData);
```

## 🗄️ Database Integration

Templates are stored in `nda_drafts.template_id`:

```typescript
// When creating a draft
await prisma.nda_drafts.create({
  data: {
    template_id: 'mutual-nda-v4',
    form_data: { /* your data */ },
    // ... other fields
  }
});

// When rendering
const draft = await prisma.nda_drafts.findUnique({ where: { id } });
const html = await renderNdaHtml(draft.form_data, draft.template_id || 'mutual-nda-v3');
```

## 🎯 Template Versioning Strategy

### Version Numbers
- **v1.x** - Initial version
- **v2.x** - Minor updates (wording, styling)
- **v3.x** - Major changes (structure, sections)

### Backward Compatibility
Keep old templates active for existing drafts:

```json
{
  "id": "mutual-nda-v3",
  "isActive": true,  // Keep true for existing drafts
  "name": "Mutual NDA v3 (Legacy)"
}
```

## 📊 Template Metadata

### Preview Images
Add preview images for template selection UI:

```json
"previewImage": "/templates/previews/mutual-nda-v4.png"
```

### Tags for Filtering
Use tags for searching and categorization:

```json
"tags": ["mutual", "simple", "quick", "tech", "startup"]
```

## 🐛 Debugging

### Test Template Rendering

```bash
# Check if template file exists
ls templates/

# View compiled template (in browser console)
fetch('/api/templates?id=mutual-nda-v4').then(r => r.json()).then(console.log)
```

### Common Issues

1. **Template not found**: Check `templateFile` path in config
2. **Missing fields**: Add to `requiredFields` or `optionalFields`
3. **Styling not applied**: Ensure styles are in template, not external CSS
4. **PDF looks different**: Test with Puppeteer's print CSS media query

## 🚀 Future Enhancements

Ideas for extending the system:

- [ ] Template preview thumbnails
- [ ] Template selector in UI
- [ ] Custom Handlebars helpers
- [ ] Multi-language templates
- [ ] Template inheritance/extends
- [ ] Conditional sections in config
- [ ] Template marketplace
- [ ] A/B testing for templates
- [ ] Template analytics (most used, conversion rates)

## 📞 Need Help?

- Review existing templates: `templates/mutual-nda-v3.hbs`
- Check configuration: `templates/template-config.json`
- Test API: `GET /api/templates`
- Template manager code: `src/lib/templateManager.ts`
