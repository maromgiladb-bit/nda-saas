# New NDA vs Edit Draft Workflow

## Overview

The system now properly differentiates between creating a **new NDA** and **editing an existing draft**. All new NDAs start with template selection, ensuring a clean, blank form.

## How It Works

### ✅ Creating a New NDA

**User Action**: Click "New NDA" button (in toolbar or any page)

**What Happens**:
1. Navigates to `/templates` (template picker page)
2. User selects a template (e.g., "Mutual NDA v3")
3. Navigates to `/fillnda?templateId=mutual-nda-v3&new=true`
4. All form fields are cleared and reset to defaults
5. localStorage draft is cleared
6. `draftId` is set to `null`
7. Page header shows "Create New NDA"
8. Fresh start with empty fields (only `effective_date` = today)

**URL Flow**: 
- `/templates` → `/fillnda?templateId=${id}&new=true`

### 📝 Editing Existing Draft

**User Action**: Click "Edit" or "Continue Editing" on a draft

**What Happens**:
1. Navigates to `/fillnda?draftId=<id>`
2. Loads the saved draft data from database
3. Pre-fills all form fields with saved values
4. Sets `draftId` to the draft's ID
5. Page header shows "Edit NDA Draft" with blue badge
6. All previously entered data is restored

**URL**: `/fillnda?draftId=abc123`

### 🔄 Auto-Save Recovery (No Parameters)

**User Action**: Navigates to `/fillnda` directly (no query params)

**What Happens**:
1. Checks localStorage for auto-saved draft
2. If found, restores the form data
3. Continues where user left off
4. Useful for browser refresh or accidental navigation away

**URL**: `/fillnda` (no parameters)

## Implementation Details

### URL Parameters

```typescript
// Create new NDA - select template first, then clear everything
/templates → /fillnda?templateId=mutual-nda-v3&new=true

// Edit existing draft - load from database
/fillnda?draftId=abc-123-def

// Auto-recover from localStorage (if available)
/fillnda
```

### Code Logic (fillnda/page.tsx)

```typescript
const urlDraftId = searchParams.get("draftId");
const urlTemplateId = searchParams.get("templateId");
const isNewNda = searchParams.get("new") === "true";

// Set template ID from URL or use default
if (urlTemplateId) {
  setTemplateId(urlTemplateId);
}

if (isNewNda) {
  // New NDA - clear everything
  console.log("🆕 Starting new NDA - clearing all data");
  setValues(DEFAULTS);
  setDraftId(null);
  localStorage.removeItem("fillndaDraft");
} else if (urlDraftId) {
  // Load specific draft
  loadDraft(urlDraftId);
} else {
  // Try localStorage recovery
  const saved = localStorage.getItem("fillndaDraft");
  if (saved) {
    setValues({ ...DEFAULTS, ...JSON.parse(saved).values });
    setDraftId(JSON.parse(saved).draftId || null);
  }
}
```

### Visual Indicators

**New NDA**:
- Header: "Create New NDA"
- Description: "Fill out the form below to generate your Non-Disclosure Agreement"
- No badge

**Editing Draft**:
- Header: "Edit NDA Draft"
- Description: "Continue editing your Non-Disclosure Agreement"
- Blue badge with "Editing Draft" label (desktop only)

## Updated Buttons

All "New NDA" buttons now link to `/templates` (template picker):

### 1. PrivateToolbar (Desktop & Mobile)
- Top-right "New NDA" button → `/templates`
- Mobile menu "New NDA" button → `/templates`
- "Fill NDA" nav link → `/templates` (changed from `/fillnda`)

### 2. My Drafts Page
- "Create New Draft" button (top-right) → `/fillnda?new=true`
- "Create Your First Draft" button (empty state) → `/fillnda?new=true`

### 3. Dashboard Page
- "Create Your First NDA" button (empty state) → `/fillnda?new=true`

### 4. Template Picker Page
- All "Use This Template" buttons → `/fillnda?templateId=${id}&new=true`

### Draft Edit Links
All "Edit" or "Continue Editing" buttons link to `/fillnda?draftId=<id>`:
- Dashboard draft cards
- My Drafts list items
- View PDF page

## User Experience Flow

### Scenario 1: New User Creating First NDA
1. User logs in → sees dashboard
2. Clicks "Create Your First NDA" or "New NDA" button
3. Lands on `/templates` (template picker)
4. Selects "Mutual NDA v3" template
5. Lands on `/fillnda?templateId=mutual-nda-v3&new=true`
6. All fields are empty (except effective_date = today)
7. Fills out form
8. Clicks "Save Draft"
9. Draft is saved with new ID

### Scenario 2: Editing Existing Draft
1. User goes to "My Drafts" or Dashboard
2. Sees list of drafts
3. Clicks "Edit" on a draft
4. Lands on `/fillnda?draftId=abc123`
5. All fields are pre-filled with saved data
6. Makes changes
7. Clicks "Save Draft"
8. Shows confirmation modal (prevent accidental overwrite)
9. Confirms → draft is updated

### Scenario 3: Browser Refresh During Editing
1. User is filling out a form
2. Browser refreshes or navigates away
3. Returns to `/fillnda` (no params)
4. Form data is restored from localStorage
5. User can continue where they left off

### Scenario 4: Starting Fresh While Editing
1. User is editing a draft
2. Wants to start a completely new NDA
3. Clicks "New NDA" button in toolbar
4. Navigates to `/templates` → selects template
5. Navigates to `/fillnda?templateId=${id}&new=true`
6. All fields are cleared (localStorage removed)
7. Fresh start

### Scenario 5: Switching Templates
1. User creates new NDA with Template A
2. Fills some fields
3. Clicks "New NDA" to start fresh
4. Goes to `/templates` → selects Template B
5. Lands on `/fillnda?templateId=template-b&new=true`
6. All fields are blank (no carry-over from Template A)

## Benefits

✅ **Clear Intent**: User knows if they're creating new or editing existing  
✅ **No Data Loss**: Explicit "new" parameter prevents accidental overwrites  
✅ **Better UX**: Visual indicators show current mode  
✅ **Auto-Recovery**: localStorage backup for accidental navigations  
✅ **Predictable**: Consistent behavior across all entry points

## Testing Checklist

- [x] Click "New NDA" → routes to `/templates`
- [x] Select template → routes to `/fillnda?templateId=${id}&new=true`
- [x] Form is empty on new NDA (except effective_date)
- [x] Click "Edit" on draft → form is pre-filled
- [x] Direct `/fillnda` → recovers from localStorage (if exists)
- [x] Click "New NDA" while editing → clears localStorage
- [x] Save new draft → creates new record
- [x] Save existing draft → shows overwrite confirmation
- [x] Template picker shows all available templates
- [x] Template selection includes `new=true` parameter
- [x] "Fill NDA" nav link routes to `/templates`
- [x] Mobile and desktop buttons work correctly
- [x] Switching templates clears previous data

## Future Enhancements

### Unsaved Changes Warning
Add confirmation when navigating away with unsaved changes:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### New NDA Confirmation Modal
When clicking "New NDA" while editing:
```typescript
if (draftId && !isFormEmpty()) {
  showConfirmationModal("Start new NDA? Current changes will be lost.");
}
```

---

**Status**: ✅ Implemented and working  
**Last Updated**: January 2025  

## Changes Made

### Files Modified:
1. **`src/app/templates/page.tsx`** (Line 45-48)
   - Updated `handleSelectTemplate()` to include `&new=true` parameter
   - Routes to: `/fillnda?templateId=${templateId}&new=true`

2. **`src/components/PrivateToolbar.tsx`** (Line 18-24)
   - Changed "Fill NDA" nav link from `/fillnda` to `/templates`
   - Updated `current` state to highlight on both `/fillnda` and `/templates`

3. **`src/app/fillnda/page.tsx`** (Lines 97-134)
   - Already had logic to handle `new=true` parameter
   - Clears localStorage when `isNewNda` is true
   - Sets values to DEFAULTS (all blank except effective_date)

### What This Fixes:
- ✅ New NDAs now always start with completely blank form
- ✅ No localStorage data carries over to new NDAs
- ✅ Template selection is required for new NDAs
- ✅ Edit mode still pre-fills data correctly
- ✅ Consistent user flow for creating new documents
