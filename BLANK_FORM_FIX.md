# Blank Form Fix for New NDAs

## Problem Statement

When creating a new NDA, the form was sometimes pre-filling with data from:
1. Previous localStorage sessions
2. Previously edited drafts
3. Other templates

The user wanted:
- **New NDAs** → Completely blank form
- **Edit Draft** → Pre-filled with saved data

## Root Cause

The template picker (`/templates` page) was navigating to fillnda without the `new=true` parameter:

```typescript
// ❌ BEFORE - Missing new=true parameter
router.push(`/fillnda?templateId=${templateId}`);
```

This caused the fillnda page to skip the "new NDA" logic and instead try to restore from localStorage, leading to data pollution.

## Solution Implemented

### 1. Template Picker Fix
**File**: `src/app/templates/page.tsx` (Line 45-48)

```typescript
// ✅ AFTER - Added new=true parameter
const handleSelectTemplate = (templateId: string) => {
  // Navigate to fillnda page with template ID and new=true for blank form
  router.push(`/fillnda?templateId=${templateId}&new=true`);
};
```

**Impact**: All template selections now explicitly mark the NDA as "new", triggering the blank form logic.

### 2. Navigation Menu Fix
**File**: `src/components/PrivateToolbar.tsx` (Line 18-24)

```typescript
// ✅ AFTER - "Fill NDA" routes to templates
const navigation = [
  { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
  { name: 'Fill NDA', href: '/templates', current: pathname === '/fillnda' || pathname === '/templates' },
  // ... other navigation items
]
```

**Before**: "Fill NDA" nav link went directly to `/fillnda` (could restore old data)  
**After**: "Fill NDA" nav link goes to `/templates` (consistent flow)

**Impact**: Ensures all new NDA creation starts with template selection, maintaining a consistent user flow.

## How It Works Now

### User Flow for New NDA:
1. Click "New NDA" button → Routes to `/templates`
2. Select template (e.g., "Mutual NDA v3") → Routes to `/fillnda?templateId=mutual-nda-v3&new=true`
3. fillnda page detects `new=true` parameter
4. Executes clean-up logic:
   ```typescript
   if (isNewNda) {
     console.log("🆕 Starting new NDA - clearing all data");
     setValues(DEFAULTS);           // All fields blank except effective_date
     setDraftId(null);               // No draft ID yet
     localStorage.removeItem("fillndaDraft"); // Clear any saved data
   }
   ```
5. User sees completely blank form (only effective_date = today)

### User Flow for Edit Draft:
1. Click "Edit" on dashboard/drafts → Routes to `/fillnda?draftId=${uuid}`
2. fillnda page detects `draftId` parameter
3. Executes load logic:
   ```typescript
   else if (urlDraftId) {
     loadDraft(urlDraftId); // Fetches from database, pre-fills all fields
   }
   ```
4. User sees form pre-filled with saved data

## Verification

### Before Fix:
```
URL: /fillnda?templateId=mutual-nda-v3
Result: ❌ Might restore localStorage data from previous session
```

### After Fix:
```
URL: /fillnda?templateId=mutual-nda-v3&new=true
Result: ✅ Always starts with blank form
```

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `src/app/templates/page.tsx` | 45-48 | Added `&new=true` to router.push |
| `src/components/PrivateToolbar.tsx` | 18-24 | Changed "Fill NDA" href from `/fillnda` to `/templates` |

## Testing Scenarios

### ✅ Test Case 1: Create New NDA
1. Click "New NDA" → Land on `/templates`
2. Select "Mutual NDA v3" → Land on `/fillnda?templateId=mutual-nda-v3&new=true`
3. **Expected**: All fields blank (except effective_date)
4. **Result**: ✅ Pass

### ✅ Test Case 2: Edit Existing Draft
1. Go to Dashboard → Find draft with status "Draft"
2. Click "Edit" → Land on `/fillnda?draftId={uuid}`
3. **Expected**: All fields pre-filled with saved data
4. **Result**: ✅ Pass

### ✅ Test Case 3: Switch Templates
1. Create new NDA with Template A → Fill some fields
2. Click "New NDA" → Select Template B
3. Land on `/fillnda?templateId=template-b&new=true`
4. **Expected**: All fields blank (no carry-over from Template A)
5. **Result**: ✅ Pass (localStorage is cleared)

### ✅ Test Case 4: localStorage Isolation
1. Fill out new NDA partially (auto-saves to localStorage)
2. Navigate away without saving draft
3. Click "New NDA" → Select template
4. Land on `/fillnda?templateId=X&new=true`
5. **Expected**: Form is blank (localStorage cleared)
6. **Result**: ✅ Pass

### ✅ Test Case 5: Navigation Menu
1. Click "Fill NDA" in navigation menu
2. **Expected**: Routes to `/templates`
3. **Result**: ✅ Pass
4. Select template → Form is blank
5. **Result**: ✅ Pass

## Benefits

✅ **Predictable Behavior**: New NDAs always start blank  
✅ **No Data Pollution**: Template switching doesn't carry old data  
✅ **Consistent Flow**: All new NDA creation goes through template picker  
✅ **Clear Intent**: URL parameters explicitly indicate new vs edit  
✅ **localStorage Safety**: Automatically cleared on new NDA creation  

## Edge Cases Handled

1. **User has localStorage from previous session**: Cleared when `new=true`
2. **User switches templates mid-creation**: Old data doesn't carry over
3. **User bookmarks fillnda page**: No parameters → uses localStorage or DEFAULTS
4. **User clicks "Fill NDA" in nav**: Now routes to templates for consistency
5. **Multiple templates exist**: Each starts with clean slate

## Related Documentation

- `NEW_VS_EDIT_WORKFLOW.md` - Complete workflow documentation
- `TEMPLATE_PICKER_GUIDE.md` - Template selection system
- `TEMPLATE_SYSTEM_GUIDE.md` - Template architecture

## Status

✅ **Implemented**: January 2025  
✅ **Tested**: All test cases pass  
✅ **No Errors**: TypeScript compilation successful  
✅ **Ready for Production**
