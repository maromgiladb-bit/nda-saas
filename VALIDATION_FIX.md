# Validation Error Fix

## Problem

Users were getting **"Validation failed"** errors when trying to preview PDFs, especially when using the "ask receiver to fill" feature.

## Root Causes

### 1. Backend Validation Not Aware of "Ask Receiver to Fill"

**Issue**: The `template-manager.ts` validation function didn't know about the `party_a_ask_receiver_fill` and `party_b_ask_receiver_fill` flags.

**Result**: Backend was still requiring Party A/B fields even when checkbox was checked to let receiver fill them.

**Fix**: Updated `validateData()` method to skip validation for fields whose party has "ask receiver to fill" checked.

### 2. Field Name Mismatch

**Issue**: The template config (`nda-config.json`) used different field names than the form:

```
Config had:                Form had:
---------------           ---------------
party_a_company_name  →   party_a_name
party_b_company_name  →   party_b_name
party_a_date          →   (not used)
party_b_date          →   (not used)
```

**Result**: Validation was looking for fields that didn't exist, causing mismatches.

**Fix**: Updated config to match actual form field names exactly.

### 3. Missing Fields in Config

**Issue**: Form had fields not in config:

```
Missing from config:
- docName
- term_months
- confidentiality_period_months
- governing_law
- ip_ownership
- non_solicit
- exclusivity
```

**Result**: These fields weren't being validated or included in PDF generation.

**Fix**: Added all form fields to the config with proper sections and positions.

## Solutions Implemented

### 1. Updated Template Manager Validation

**File**: `src/lib/template-manager.ts`

```typescript
validateData(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const config = this.loadConfig()
  const errors: string[] = []

  // Check if receiver should fill party A or B
  const partyAReceiverFills = data.party_a_ask_receiver_fill === true
  const partyBReceiverFills = data.party_b_ask_receiver_fill === true

  Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
    // Skip validation if this field's party is being filled by receiver
    const skipValidation = 
      (fieldConfig.section === 'party_a' && partyAReceiverFills) ||
      (fieldConfig.section === 'party_b' && partyBReceiverFills)
    
    if (skipValidation) {
      return // Don't validate fields that receiver will fill
    }

    // Validate required fields
    if (fieldConfig.required && !data[fieldName]) {
      errors.push(`${fieldConfig.label} is required`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Changes**:
- ✅ Reads `party_a_ask_receiver_fill` flag from form data
- ✅ Reads `party_b_ask_receiver_fill` flag from form data
- ✅ Skips validation for party fields when receiver should fill
- ✅ Only validates fields that user is expected to fill

### 2. Updated Template Config

**File**: `templates/nda-config.json`

**Changes**:
- ✅ Renamed `party_a_company_name` → `party_a_name`
- ✅ Renamed `party_b_company_name` → `party_b_name`
- ✅ Removed unused `party_a_date` and `party_b_date`
- ✅ Added `docName` field
- ✅ Added `term_months` field
- ✅ Added `confidentiality_period_months` field
- ✅ Added `party_b_email` field
- ✅ Added `governing_law` field
- ✅ Added `ip_ownership` field
- ✅ Added `non_solicit` field
- ✅ Added `exclusivity` field
- ✅ Added new `clauses` section for legal terms
- ✅ Updated all field positions for better layout

**New Field Structure**:
```json
{
  "fields": {
    // Document fields (section: "document")
    "docName": { ... },
    "effective_date": { ... },
    "term_months": { ... },
    "confidentiality_period_months": { ... },
    
    // Party A fields (section: "party_a")
    "party_a_name": { ... },
    "party_a_address": { ... },
    "party_a_signatory_name": { ... },
    "party_a_title": { ... },
    
    // Party B fields (section: "party_b")
    "party_b_name": { ... },
    "party_b_address": { ... },
    "party_b_signatory_name": { ... },
    "party_b_title": { ... },
    "party_b_email": { ... },
    
    // Clause fields (section: "clauses")
    "governing_law": { ... },
    "ip_ownership": { ... },
    "non_solicit": { ... },
    "exclusivity": { ... }
  }
}
```

## Validation Flow Now

### Scenario 1: Normal Fill (No Checkboxes)

```
User fills:
✅ Document fields (docName, dates, terms)
✅ Party A fields (name, address, signatory, title)
✅ Party B fields (name, address, signatory, title, email)
✅ Clause fields (governing law, IP, non-solicit, exclusivity)

Backend validates:
✅ All document fields (required)
✅ All Party A fields (required)
✅ All Party B fields (required)
✅ All clause fields (required)

Result: ✅ Validation passes → PDF generates
```

### Scenario 2: Party B "Ask Receiver to Fill" Checked

```
User fills:
✅ Document fields
✅ Party A fields
☑️  Party B checkbox checked
❌ Party B fields (disabled, empty)
✅ Clause fields

Backend validates:
✅ All document fields (required)
✅ All Party A fields (required)
⏭️  Party B fields (SKIPPED - receiver will fill)
✅ All clause fields (required)

Result: ✅ Validation passes → PDF generates with placeholders
```

### Scenario 3: Both Parties "Ask Receiver to Fill"

```
User fills:
✅ Document fields
☑️  Party A checkbox checked
☑️  Party B checkbox checked
❌ Party A fields (disabled, empty)
❌ Party B fields (disabled, empty)
✅ Clause fields

Backend validates:
✅ All document fields (required)
⏭️  Party A fields (SKIPPED)
⏭️  Party B fields (SKIPPED)
✅ All clause fields (required)

Result: ✅ Validation passes → PDF generates with placeholders
```

## Testing

To verify the fix works:

1. **Test 1: Normal Fill**
   - Fill all fields
   - Click "Preview PDF"
   - ✅ Should generate PDF with all data

2. **Test 2: Party B Receiver Fills**
   - Fill Document + Party A + Clauses
   - Check "Ask receiver to fill" for Party B
   - Leave Party B fields empty
   - Click "Preview PDF"
   - ✅ Should generate PDF with Party B placeholders

3. **Test 3: Both Parties Receiver Fills**
   - Fill Document + Clauses only
   - Check both "Ask receiver to fill" boxes
   - Leave both party fields empty
   - Click "Preview PDF"
   - ✅ Should generate PDF with both party placeholders

4. **Test 4: Missing Required Field**
   - Leave a document field empty (e.g., docName)
   - Click "Preview PDF"
   - ❌ Should show validation error
   - ✅ Error message should be clear

## Benefits

✅ **No More False Validation Errors** - Checkboxes properly control validation  
✅ **All Form Fields Supported** - Config matches form exactly  
✅ **Accurate Field Mapping** - Names align between form and config  
✅ **Clear Error Messages** - Users know exactly what's missing  
✅ **Flexible Workflow** - Can create NDAs with partial information  

## Files Changed

1. **`src/lib/template-manager.ts`** - Updated `validateData()` method
2. **`templates/nda-config.json`** - Fixed field names and added missing fields

---

**Status**: ✅ Fixed and tested  
**Date**: October 29, 2025
