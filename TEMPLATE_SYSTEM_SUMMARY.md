# ✅ Template System - Complete Setup

Your NDA application now has a **flexible, scalable template system** that makes it easy to add, modify, and manage multiple NDA templates.

## 🎯 What's Been Implemented

### 1. **Central Template Configuration** (`templates/template-config.json`)
- Single JSON file to define all templates
- Includes field definitions, requirements, defaults
- Easy to add new templates without touching code

### 2. **Template Manager** (`src/lib/templateManager.ts`)
- Handles template loading, compilation, and caching
- Provides validation and field definitions
- Type-safe API for working with templates

### 3. **Templates API** (`/api/templates`)
- List all available templates
- Get specific template details
- Filter by category

### 4. **Two Example Templates**
- **mutual-nda-v3.hbs** - Comprehensive 15-section professional NDA
- **one-way-nda-v1.hbs** - Simple one-way NDA for vendor/consultant scenarios

---

## 🚀 How to Add a New Template (3 Simple Steps)

### Step 1: Create `.hbs` file
```bash
# In templates/ directory
templates/my-new-nda-v1.hbs
```

### Step 2: Add to `template-config.json`
```json
{
  "id": "my-new-nda-v1",
  "name": "My New NDA",
  "version": "1.0",
  "category": "mutual",
  "templateFile": "my-new-nda-v1.hbs",
  "isActive": true,
  "requiredFields": ["effective_date", "party_a_name", ...],
  "defaultValues": { "term_months": "12" }
}
```

### Step 3: Use it!
```typescript
const html = await renderNdaHtml(formData, 'my-new-nda-v1');
```

---

## 📁 File Structure

```
templates/
├── template-config.json          # ⭐ Central configuration
├── mutual-nda-v3.hbs            # Professional mutual NDA
├── one-way-nda-v1.hbs           # Simple one-way NDA
└── [your-template].hbs          # Add more here!

src/lib/
├── templateManager.ts            # ⭐ Template loading & caching
├── renderNdaHtml.ts             # Uses templateManager
└── htmlToPdf.ts                 # Converts to PDF

src/app/api/
├── templates/route.ts            # ⭐ Templates API endpoint
├── ndas/preview/route.ts        # Uses renderNdaHtml(data, templateId)
└── ndas/send/route.ts           # Uses renderNdaHtml(data, templateId)
```

---

## 🔧 API Usage Examples

### List All Templates
```bash
GET /api/templates
```
```json
{
  "templates": [
    {
      "id": "mutual-nda-v3",
      "name": "Mutual NDA (Comprehensive)",
      "category": "mutual",
      "version": "3.0",
      ...
    },
    ...
  ],
  "count": 2
}
```

### Get Specific Template
```bash
GET /api/templates?id=mutual-nda-v3
```
```json
{
  "template": { ... },
  "fields": {
    "required": { "effective_date": { ... }, ... },
    "optional": { "party_a_email": { ... }, ... }
  }
}
```

### Filter by Category
```bash
GET /api/templates?category=one-way
```

---

## 💻 Code Usage

### In API Routes
```typescript
import { renderNdaHtml } from '@/lib/renderNdaHtml';

// Use default template
const html = await renderNdaHtml(formData);

// Use specific template
const html = await renderNdaHtml(formData, 'one-way-nda-v1');
```

### Template Management
```typescript
import {
  getActiveTemplates,
  getTemplateById,
  getTemplateFields,
  validateTemplateData
} from '@/lib/templateManager';

// Get all active templates
const templates = getActiveTemplates();

// Get template info
const template = getTemplateById('mutual-nda-v3');

// Get field definitions
const { required, optional } = getTemplateFields('mutual-nda-v3');

// Validate data
const { isValid, errors } = validateTemplateData('mutual-nda-v3', data);
```

---

## 🎨 Template Categories

- **`mutual`** - Both parties share confidential information
- **`one-way`** - One party discloses to another
- **`custom`** - Special use cases

---

## ✨ Key Features

### 1. **Caching**
- Templates are compiled once and cached in memory
- Fast rendering for repeated requests
- Use `clearTemplateCache()` in development

### 2. **Validation**
- Required vs optional fields
- Field type definitions (text, email, date, etc.)
- Automatic validation before rendering

### 3. **Default Values**
- Set defaults per template
- Merged with user data automatically

### 4. **Flexible Fields**
- Each template can have different fields
- Conditional sections with Handlebars `{{#if}}`
- Optional fields handled gracefully

### 5. **Versioning**
- Keep old versions for existing drafts
- Mark `isActive: false` to hide from UI
- All versions stay in config for backward compatibility

---

## 📊 Database Integration

The `nda_drafts.template_id` field stores which template was used (UUID).

**Future Enhancement:** Map UUID → template ID string:
```typescript
// Add mapping table or use template config ID directly
const templateMapping = {
  'uuid-from-db': 'mutual-nda-v3'
};
```

For now, the system defaults to `'mutual-nda-v3'` and supports template override via API:

```typescript
// Preview with specific template
POST /api/ndas/preview
{
  "draftId": "...",
  "templateId": "one-way-nda-v1"  // Optional override
}
```

---

## 🎯 Testing Your New Template

1. **Create the .hbs file** with your HTML/Handlebars markup
2. **Add to config** with required fields
3. **Test via API:**
   ```bash
   curl http://localhost:3001/api/templates?id=your-template-id
   ```
4. **Preview in app:**
   - Go to `/fillnda`
   - Fill out form
   - Click "Preview Document"

5. **Or test directly via API:**
   ```bash
   curl -X POST http://localhost:3001/api/ndas/preview \
     -H "Content-Type: application/json" \
     -d '{"templateId": "your-template-id", "party_a_name": "Test", ...}'
   ```

---

## 📝 Field Types Available

```json
{
  "type": "text",      // Single-line text
  "type": "email",     // Email with validation
  "type": "tel",       // Phone number
  "type": "date",      // Date picker
  "type": "number",    // Numeric input
  "type": "textarea"   // Multi-line text
}
```

---

## 🔒 Best Practices

1. **Always set `isActive: true`** for new templates
2. **Use semantic versioning** (v1.0, v1.1, v2.0)
3. **Keep old versions** with `isActive: false` for existing drafts
4. **Test with preview** before sending to users
5. **Document your changes** in template description
6. **Use consistent field names** across templates when possible

---

## 🚀 Future Enhancements (Easy to Add)

- [ ] Template selector dropdown in UI
- [ ] Template preview thumbnails
- [ ] Custom Handlebars helpers (dates, currency, etc.)
- [ ] Multi-language support
- [ ] Template inheritance/extends
- [ ] A/B testing different templates
- [ ] Analytics: which templates are most popular

---

## 📖 Full Documentation

See `TEMPLATE_GUIDE.md` for complete documentation including:
- Styling guidelines
- Handlebars syntax
- Advanced features
- Troubleshooting
- Examples

---

## ✅ What's Working Now

1. ✅ Template system fully functional
2. ✅ Two example templates included
3. ✅ API endpoints working
4. ✅ Integration with preview/send APIs
5. ✅ Validation and field definitions
6. ✅ Caching for performance
7. ✅ Easy to extend with new templates

---

## 🎉 Ready to Use!

Your system is now set up to handle **multiple NDA templates** with ease. Adding a new template is as simple as creating a new `.hbs` file and adding a few lines to the config JSON!

**Try it now:**
1. Test the existing templates in `/fillnda`
2. View available templates: `http://localhost:3001/api/templates`
3. Create your own template following the guide above

Need help? Check `TEMPLATE_GUIDE.md` for detailed instructions!
