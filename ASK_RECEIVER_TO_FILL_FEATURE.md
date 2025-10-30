# Ask Receiver to Fill Feature

## Overview

When creating an NDA, you can now check the **"Ask receiver to fill"** checkbox for Party A or Party B. When checked, the PDF will display placeholder text instead of filling those fields with your input.

## How It Works

### User Interface

**Party A Section:**
- Checkbox: "Ask receiver to fill"
- When checked: All Party A fields are disabled
- When unchecked: Party A fields can be filled normally

**Party B Section:**
- Checkbox: "Ask receiver to fill"
- When checked: All Party B fields are disabled
- When unchecked: Party B fields can be filled normally

### PDF Behavior

When the checkbox is checked, the generated PDF will show:

```
Instead of:        Shows:
--------------     ---------------------------------
"Acme Corp"   →    [To be filled by receiving party]
"123 Main St" →    [To be filled by receiving party]
"John Smith"  →    [To be filled by receiving party]
```

### Visual Styling

**Placeholder Text:**
- Text: `[To be filled by receiving party]`
- Color: Gray (RGB 0.5, 0.5, 0.5)
- Font Size: 9pt (slightly smaller than normal 10pt)

**Regular Text:**
- Color: Black (RGB 0, 0, 0)
- Font Size: 10pt

## Use Cases

### Scenario 1: Party A is Complete, Party B to Fill
```
✅ Party A fields: Filled with your company details
☑️  "Ask receiver to fill" checked for Party B
📝 Result: Party B fields show placeholder text in PDF
```

**Example:**
You're sending an NDA to a potential client. You fill in your company details (Party A), but check "Ask receiver to fill" for Party B so they can add their details when they receive it.

### Scenario 2: Both Parties to Fill Later
```
☑️  "Ask receiver to fill" checked for Party A
☑️  "Ask receiver to fill" checked for Party B
📝 Result: Both parties' fields show placeholder text
```

**Example:**
Creating a template NDA to be filled out by both parties later during a meeting or negotiation.

### Scenario 3: Full Pre-fill (No Placeholders)
```
✅ Party A fields: Filled
✅ Party B fields: Filled
☐  Neither checkbox checked
📝 Result: All fields filled with actual data
```

**Example:**
You have all information for both parties and want to generate a complete NDA ready for signature.

## Implementation Details

### Form Data Structure

```typescript
{
  // Regular fields
  party_a_company_name: "Acme Corp",
  party_a_address: "123 Main St",
  party_b_company_name: "XYZ Inc",
  
  // Control flags
  party_a_ask_receiver_fill: false,  // Party A fields use actual values
  party_b_ask_receiver_fill: true,   // Party B fields use placeholders
}
```

### PDF Generation Logic

**Overlay Mode (Current):**
```typescript
// Check flags
const partyAReceiverFills = formData.party_a_ask_receiver_fill === true
const partyBReceiverFills = formData.party_b_ask_receiver_fill === true

// For each field
if (shouldShowPlaceholder) {
  displayValue = '[To be filled by receiving party]'
  textColor = rgb(0.5, 0.5, 0.5)  // Gray
  textSize = 9
} else if (value) {
  displayValue = String(value)
  textColor = rgb(0, 0, 0)  // Black
  textSize = 10
}
```

**Form Field Mode:**
```typescript
// Same logic, but uses PDF form fields
if (shouldShowPlaceholder) {
  field.setText('[To be filled by receiving party]')
} else {
  field.setText(String(value))
}
```

### Field Mapping

The system checks the `section` property in the config to determine which fields belong to which party:

```json
{
  "party_a_company_name": {
    "section": "party_a",  // ← Checked against party_a_ask_receiver_fill
    "pdfPosition": { ... }
  },
  "party_b_company_name": {
    "section": "party_b",  // ← Checked against party_b_ask_receiver_fill
    "pdfPosition": { ... }
  }
}
```

## Affected Fields

### Party A Fields (section: "party_a")
- `party_a_company_name` - Company Name
- `party_a_address` - Address
- `party_a_signatory_name` - Signatory Name
- `party_a_title` - Signatory Title
- `party_a_date` - Signature Date

### Party B Fields (section: "party_b")
- `party_b_company_name` - Company Name
- `party_b_address` - Address
- `party_b_signatory_name` - Signatory Name
- `party_b_title` - Signatory Title
- `party_b_date` - Signature Date

### Document Fields (section: "document")
- `effective_date` - Always uses actual value (not affected by checkboxes)

## Validation Rules

### When "Ask receiver to fill" is CHECKED:
- Party fields are **not required** for validation ✅
- Fields are **disabled** in the UI
- User cannot enter data for that party
- PDF shows placeholder text
- Backend validation skips these fields

### When "Ask receiver to fill" is UNCHECKED:
- Party fields **are required** for validation
- Fields are **enabled** in the UI
- User must enter data for that party
- PDF shows actual entered data

### Validation Logic:

**Frontend (fillnda/page.tsx):**
```typescript
// Only validate Party A if NOT asking receiver to fill
if (!values.party_a_ask_receiver_fill) {
  mandatoryFields.push(
    "party_a_name", 
    "party_a_address", 
    "party_a_signatory_name", 
    "party_a_title"
  );
}

// Only validate Party B if NOT asking receiver to fill
if (!values.party_b_ask_receiver_fill) {
  mandatoryFields.push(
    "party_b_name", 
    "party_b_address", 
    "party_b_signatory_name", 
    "party_b_title", 
    "party_b_email"
  );
}
```

**Backend (template-manager.ts):**
```typescript
validateData(data: Record<string, unknown>) {
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
}
```

## Workflow Example

### Creating NDA with Party B to Fill:

1. **Click "New NDA"**
   - Navigate to `/fillnda?new=true`

2. **Fill Document Details** (Step 1)
   - Document Title: "Partnership NDA"
   - Effective Date: Today
   - Term: 12 months
   - Confidentiality Period: 24 months

3. **Fill Party A Details** (Step 2)
   - Company Name: "Your Company Inc"
   - Address: "123 Business St"
   - Signatory: "John Doe"
   - Title: "CEO"
   - ☐ "Ask receiver to fill" - UNCHECKED

4. **Party B Details** (Step 3)
   - ☑️ Check "Ask receiver to fill"
   - All fields become disabled and grayed out
   - Email can still be entered (for sending)

5. **Preview PDF**
   - Party A fields: Show "Your Company Inc", "123 Business St", etc.
   - Party B fields: Show "[To be filled by receiving party]" in gray

6. **Send for Signature**
   - Recipient receives link
   - They can fill in Party B details
   - Sign electronically

## Benefits

✅ **Flexible Workflow** - Don't need all information upfront  
✅ **Clear Communication** - Receiver knows what they need to fill  
✅ **Time Saving** - Create NDA even when missing party details  
✅ **Professional** - Clean placeholder text instead of empty fields  
✅ **Less Errors** - Can't accidentally submit with missing required fields

## File Locations

- **PDF Generation**: `src/app/api/ndas/fill-template/route.ts`
- **Frontend Form**: `src/app/fillnda/page.tsx`
- **Template Config**: `templates/nda-config.json`
- **Type Definitions**: `src/lib/template-manager.ts`

## Testing Checklist

- [ ] Check Party A "ask receiver to fill" → Party A fields disabled
- [ ] Check Party B "ask receiver to fill" → Party B fields disabled
- [ ] Uncheck boxes → Fields re-enabled
- [ ] Preview PDF with Party A placeholder → Shows gray text
- [ ] Preview PDF with Party B placeholder → Shows gray text
- [ ] Preview PDF with both parties filled → Shows black text
- [ ] Validation skips fields when "ask receiver to fill" checked
- [ ] Save draft preserves checkbox state
- [ ] Load draft restores checkbox state

---

**Status**: ✅ Implemented and working  
**Last Updated**: October 29, 2025
