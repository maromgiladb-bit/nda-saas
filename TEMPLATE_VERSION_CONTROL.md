# Template Version Control & Track Changes

## 🎯 Overview

Your NDA template system now includes comprehensive version tracking and change management features. You can:

- Track all changes made to templates
- Compare different versions
- View version history
- Mark templates as deprecated
- Automatically migrate to new versions

---

## 📋 Track Changes Features

### 1. **Changelog** (`templates/CHANGELOG.md`)
- Manual log of all template changes
- Organized by template and version
- Documents added/changed/removed/fixed items
- Includes field changes and new features

### 2. **Version Metadata** (in `template-config.json`)
```json
{
  "version": "3.0",
  "changelog": "templates/CHANGELOG.md#anchor",
  "deprecated": false,
  "replacedBy": "mutual-nda-v4",
  "createdAt": "2025-10-30",
  "updatedAt": "2025-10-30"
}
```

### 3. **Comparison API** (`/api/templates/compare`)
- Compare two template versions
- See added/removed fields
- Track default value changes
- Identify version type (major/minor/patch)

### 4. **Version History API**
- Get all versions of a template family
- Find latest active version
- Track deprecation status

---

## 🚀 Usage Examples

### Compare Two Templates

```bash
# Compare mutual-nda v2 vs v3
GET /api/templates/compare?template1=mutual-nda-v2&template2=mutual-nda-v3
```

**Response:**
```json
{
  "template1": {
    "id": "mutual-nda-v2",
    "version": "2.0",
    "isDeprecated": true,
    "replacementId": "mutual-nda-v3"
  },
  "template2": {
    "id": "mutual-nda-v3",
    "version": "3.0",
    "isDeprecated": false
  },
  "comparison": {
    "versionChange": "major",
    "addedFields": ["party_a_phone", "party_b_phone"],
    "removedFields": [],
    "changedDefaults": {
      "term_months": { "old": "6", "new": "12" }
    },
    "summary": {
      "fieldsAdded": 2,
      "fieldsRemoved": 0,
      "defaultsChanged": 1
    }
  }
}
```

### Get Version History

```bash
# Get all versions of mutual NDA
GET /api/templates/compare?family=mutual-nda
```

**Response:**
```json
{
  "family": "mutual-nda",
  "versions": [
    {
      "id": "mutual-nda-v3",
      "name": "Mutual NDA (Comprehensive)",
      "version": "3.0",
      "isActive": true,
      "deprecated": false,
      "createdAt": "2025-10-30",
      "updatedAt": "2025-10-30"
    },
    {
      "id": "mutual-nda-v2",
      "name": "Mutual NDA (Standard)",
      "version": "2.0",
      "isActive": true,
      "deprecated": true,
      "replacedBy": "mutual-nda-v3",
      "createdAt": "2025-06-15",
      "updatedAt": "2025-06-15"
    }
  ],
  "count": 2
}
```

### Get Latest Version

```bash
# Get latest active version
GET /api/templates/compare?latest=mutual-nda
```

**Response:**
```json
{
  "family": "mutual-nda",
  "latest": {
    "id": "mutual-nda-v3",
    "name": "Mutual NDA (Comprehensive)",
    "version": "3.0",
    "description": "Professional mutual non-disclosure agreement..."
  }
}
```

---

## 📝 How to Update a Template

### Step 1: Decide on Version Number

**Major version (X.0)** - Breaking changes:
- Changed legal language
- Added/removed sections
- Restructured agreement
- Changed field requirements

**Minor version (X.Y)** - Non-breaking changes:
- Added optional fields
- Updated styling
- Improved layout
- Added conditional sections

**Patch version (X.Y.Z)** - Fixes:
- Fixed typos
- Corrected formatting
- Bug fixes

### Step 2: Create New Template File

```bash
# For major/minor versions
cp templates/mutual-nda-v3.hbs templates/mutual-nda-v4.hbs

# Make your changes to v4
```

### Step 3: Update `template-config.json`

```json
{
  "templates": [
    {
      "id": "mutual-nda-v4",
      "name": "Mutual NDA (Enhanced)",
      "version": "4.0",
      "templateFile": "mutual-nda-v4.hbs",
      "isActive": true,
      "createdAt": "2025-11-01",
      "updatedAt": "2025-11-01",
      "changelog": "templates/CHANGELOG.md#mutual-nda-v4-version-40---2025-11-01"
    },
    {
      "id": "mutual-nda-v3",
      "name": "Mutual NDA (Comprehensive)",
      "version": "3.0",
      "isActive": true,
      "deprecated": true,
      "replacedBy": "mutual-nda-v4",
      "createdAt": "2025-10-30",
      "updatedAt": "2025-11-01"
    }
  ]
}
```

### Step 4: Update `CHANGELOG.md`

```markdown
## [mutual-nda-v4] Version 4.0 - 2025-11-01

### Added
- New arbitration clause
- Enhanced termination section

### Changed
- Updated confidentiality period to 36 months default
- Improved signature block layout

### Fixed
- Corrected governing law section formatting

### Migration Notes
- Users on v3 should migrate to v4
- All field names remain compatible
```

### Step 5: Test the New Version

```typescript
import { compareTemplates } from '@/lib/templateManager';

// Compare with previous version
const diff = compareTemplates('mutual-nda-v3', 'mutual-nda-v4');
console.log('Added fields:', diff.addedFields);
console.log('Version change:', diff.versionDiff);
```

---

## 🔄 Migration Strategy

### For Existing Drafts

```typescript
// In your API route
const draft = await prisma.nda_drafts.findUnique({ where: { id } });

// Check if template is deprecated
const template = getTemplateById(draft.template_id);
if (template?.deprecated && template.replacedBy) {
  console.log(`Template ${draft.template_id} is deprecated`);
  console.log(`Consider migrating to ${template.replacedBy}`);
  
  // Optional: Automatically use new template
  const newTemplate = template.replacedBy;
  const html = await renderNdaHtml(draft.form_data, newTemplate);
}
```

### For New Drafts

```typescript
// Always use latest version
import { getLatestTemplate } from '@/lib/templateManager';

const latestTemplate = getLatestTemplate('mutual-nda');
await prisma.nda_drafts.create({
  data: {
    template_id: latestTemplate.id,
    form_data: { ... }
  }
});
```

---

## 📊 Track Changes in Code

### Using Template Manager Functions

```typescript
import {
  getTemplateVersions,
  getLatestTemplate,
  compareTemplates,
  getTemplateMetadata
} from '@/lib/templateManager';

// Get all versions
const versions = getTemplateVersions('mutual-nda');
console.log(`Found ${versions.length} versions`);

// Get latest
const latest = getLatestTemplate('mutual-nda');
console.log(`Latest: ${latest.id} v${latest.version}`);

// Compare versions
const diff = compareTemplates('mutual-nda-v2', 'mutual-nda-v3');
console.log('Changes:', diff);

// Get metadata
const metadata = getTemplateMetadata('mutual-nda-v3');
console.log('Last updated:', metadata.lastModified);
```

---

## 🏷️ Version Naming Convention

Use this format: `{template-family}-v{major}.{minor}.{patch}`

**Examples:**
- `mutual-nda-v1.0` - Initial version
- `mutual-nda-v1.1` - Minor update
- `mutual-nda-v1.1.1` - Patch fix
- `mutual-nda-v2.0` - Major revision
- `one-way-nda-v1.0` - Different template family

**Template Families:**
- `mutual-nda` - Mutual NDAs
- `one-way-nda` - One-way NDAs
- `startup-nda` - Startup-specific
- `vendor-nda` - Vendor agreements
- `employee-nda` - Employee agreements

---

## ⚠️ Important Notes

### Always Keep Old Versions
```json
{
  "id": "mutual-nda-v2",
  "isActive": true,        // Keep true!
  "deprecated": true,      // But mark as deprecated
  "replacedBy": "mutual-nda-v3"
}
```

**Why?**
- Existing drafts use old templates
- Users might need to regenerate old PDFs
- Legal compliance and audit trails

### Document All Changes
- Update CHANGELOG.md
- Add version metadata
- Note breaking changes
- Include migration guide

### Test Before Deploying
- Generate PDF preview
- Check all fields render
- Verify signature blocks
- Test edge cases

---

## 🔍 Audit Trail

Every template includes:
- **Version number** - Semantic versioning
- **Created date** - When first added
- **Updated date** - Last modification
- **Changelog link** - Documentation reference
- **Deprecated flag** - Lifecycle status
- **Replacement ID** - Migration path

This creates a complete audit trail for compliance and debugging.

---

## 📈 Best Practices

1. **Increment versions correctly**
   - Breaking change = major version
   - New features = minor version
   - Bug fixes = patch version

2. **Document everything**
   - What changed and why
   - Which fields added/removed
   - Migration instructions

3. **Test thoroughly**
   - Compare with previous version
   - Check field compatibility
   - Verify PDF output

4. **Deprecate gracefully**
   - Mark old templates as deprecated
   - Point to replacement
   - Keep accessible for old drafts

5. **Communicate changes**
   - Update documentation
   - Notify users of major changes
   - Provide migration tools

---

## 🚀 Future Enhancements

Possible additions to the track changes system:

- [ ] Automated changelog generation from git commits
- [ ] Visual diff tool for template changes
- [ ] Migration scripts for bulk updating drafts
- [ ] Version approval workflow
- [ ] Template rollback functionality
- [ ] Change notification system
- [ ] A/B testing for template versions
- [ ] Analytics on version usage

---

## 📞 Quick Reference

**Compare templates:**
```bash
GET /api/templates/compare?template1=ID1&template2=ID2
```

**Get version history:**
```bash
GET /api/templates/compare?family=template-prefix
```

**Get latest version:**
```bash
GET /api/templates/compare?latest=template-prefix
```

**In code:**
```typescript
import { compareTemplates, getLatestTemplate } from '@/lib/templateManager';
```

**Update CHANGELOG.md when:**
- Creating new version
- Modifying existing template
- Adding/removing fields
- Changing defaults
- Fixing bugs

---

Your template system now has professional-grade version control! 🎉
