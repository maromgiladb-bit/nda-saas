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

---

## HTML Editor: Individual Field Checkboxes (NEW)

### Overview
The HTML NDA editor (`fillndahtml`) now supports **individual checkboxes** for each Party B field, providing granular control over which specific fields the receiver should fill.

### Key Difference from PDF Editor

**PDF Editor (`fillnda`):**
- Single "Ask receiver to fill" checkbox for all Party B fields
- All-or-nothing approach

**HTML Editor (`fillndahtml`):**
- Individual checkbox for each Party B field
- Fine-grained control per field

### Individual Checkboxes

Each Party B field has its own checkbox:
1. ☑️ **Party Name** - `party_b_name_ask_receiver`
2. ☑️ **Address** - `party_b_address_ask_receiver`
3. ☑️ **Phone Number** - `party_b_phone_ask_receiver`
4. ☑️ **Signatory Name** - `party_b_signatory_name_ask_receiver`
5. ☑️ **Title** - `party_b_title_ask_receiver`
6. ☑️ **Email Address** - `party_b_email_ask_receiver`

### Use Cases

#### Scenario 1: Partial Company Information
You know the company name and address, but not the contact person:
```
✅ Party B Name: "XYZ Corporation" (filled)
✅ Party B Address: "456 Business Blvd" (filled)
☑️ Signatory Name: Ask receiver to fill
☑️ Title: Ask receiver to fill
☑️ Email: Ask receiver to fill
☐ Phone: (optional, not asking)
```

#### Scenario 2: Missing Contact Details
You have the signatory's name but not their contact information:
```
✅ Party B Name: "ABC Inc" (filled)
✅ Signatory Name: "Jane Smith" (filled)
☑️ Email: Ask receiver to fill
☑️ Phone: Ask receiver to fill
☐ Address: (optional, not asking)
☐ Title: (optional, not asking)
```

#### Scenario 3: Email Only
You have everything except the email:
```
✅ All fields filled EXCEPT
☑️ Email: Ask receiver to fill
```

### UI Design

**Checkbox Placement:**
- Located above each field label in a flex container
- Right-aligned with `justify-between`
- Compact styling for space efficiency

**Checkbox Styling:**
```css
/* Container */
.flex.items-center.gap-2.text-xs.bg-blue-50.px-3.py-1.rounded-lg

/* Checkbox */
.form-checkbox.h-3.w-3.text-blue-600.rounded

/* Label Text */
- Full-width fields: "Ask receiver to fill"
- Narrow fields (Signatory, Title): "Ask receiver"
```

**Field States:**
- Unchecked: Field enabled, normal background
- Checked: Field disabled, gray background (`disabled:bg-gray-100`)

### Data Structure

**FormValues Type:**
```typescript
type FormValues = {
  // ... other fields
  
  // Individual Party B flags
  party_b_name_ask_receiver: boolean;
  party_b_address_ask_receiver: boolean;
  party_b_phone_ask_receiver: boolean;
  party_b_signatory_name_ask_receiver: boolean;
  party_b_title_ask_receiver: boolean;
  party_b_email_ask_receiver: boolean;
  
  // OLD: party_b_ask_receiver_fill (removed)
}
```

**Defaults:**
```typescript
const DEFAULTS = {
  // ... other defaults
  party_b_name_ask_receiver: false,
  party_b_address_ask_receiver: false,
  party_b_phone_ask_receiver: false,
  party_b_signatory_name_ask_receiver: false,
  party_b_title_ask_receiver: false,
  party_b_email_ask_receiver: false,
}
```

### Validation Logic

**Conditional Field Requirements:**
```typescript
const mandatoryFields = [/* base fields */];

// Add each Party B field only if NOT asking receiver to fill
if (!values.party_b_name_ask_receiver) {
  mandatoryFields.push("party_b_name");
}
if (!values.party_b_address_ask_receiver) {
  mandatoryFields.push("party_b_address");
}
if (!values.party_b_phone_ask_receiver) {
  mandatoryFields.push("party_b_phone");
}
// ... etc
```

**Step Completion:**
```typescript
case 2: // Party B step
  // Add fields to check based on individual flags
  if (!values.party_b_name_ask_receiver) {
    stepFields.push("party_b_name");
  }
  // ... for each field
  
  // If all fields have "ask receiver" checked, step is complete
  if (stepFields.length === 0) {
    return true;
  }
  break;
```

### Preview Behavior

**HTML Preview API (`/api/ndas/preview-html`):**
```typescript
// Check each field individually
if (formData.party_b_name_ask_receiver) {
  processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
}
if (formData.party_b_address_ask_receiver) {
  processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
}
// ... etc for each field
```

**Result:**
- Only checked fields show placeholder text
- Unchecked fields show actual entered values
- Mixed placeholders and real data in same section

### Progress Display

**Review Step:**
Shows which specific fields receiver will fill:
```typescript
{(() => {
  const fieldsToFill = [];
  if (values.party_b_name_ask_receiver) fieldsToFill.push("Name");
  if (values.party_b_address_ask_receiver) fieldsToFill.push("Address");
  if (values.party_b_phone_ask_receiver) fieldsToFill.push("Phone");
  if (values.party_b_signatory_name_ask_receiver) fieldsToFill.push("Signatory");
  if (values.party_b_title_ask_receiver) fieldsToFill.push("Title");
  if (values.party_b_email_ask_receiver) fieldsToFill.push("Email");
  
  if (fieldsToFill.length > 0) {
    return <span>Receiver will fill: {fieldsToFill.join(", ")}</span>;
  }
})()}
```

**Display Examples:**
- `Receiver will fill: Email, Phone`
- `Receiver will fill: Signatory, Title, Email`
- `Receiver will fill: Name, Address, Phone, Signatory, Title, Email` (all fields)
- No badge if no fields are delegated

### Files Modified

1. **src/app/fillndahtml/page.tsx**
   - FormValues type (6 new boolean fields)
   - DEFAULTS object (6 new fields)
   - Party B UI section (individual checkboxes)
   - validate() function (granular checks)
   - isStepComplete() function (per-field validation)
   - computeCompletionPercent() function
   - Review step display (comma-separated list)

2. **src/app/api/ndas/preview-html/route.ts**
   - Individual flag checks for placeholder text
   - Per-field placeholder application

### Benefits

✅ **Maximum Flexibility** - Choose exactly which fields to delegate  
✅ **Partial Information** - Fill what you know, ask for what you don't  
✅ **Clear Intent** - Receiver sees exactly which fields need their input  
✅ **Better UX** - No need to clear fields or re-enter data  
✅ **Professional Output** - Mix of real data and placeholders as needed

### Comparison

| Feature | PDF Editor | HTML Editor |
|---------|-----------|-------------|
| Control Level | All-or-nothing | Per-field |
| Checkboxes | 1 global | 6 individual |
| Flexibility | Limited | Maximum |
| Preview | All/none placeholders | Mixed content |
| Use Cases | Simple delegation | Complex scenarios |

### Implementation Status

- ✅ FormValues type updated
- ✅ DEFAULTS initialized
- ✅ Individual checkboxes in UI
- ✅ Field disable/enable logic
- ✅ Validation respects individual flags
- ✅ Step completion logic
- ✅ Preview HTML API handles individual flags
- ✅ Progress display shows delegated fields
- ✅ Server compiles without errors

### Testing Checklist

- [x] Individual checkboxes render correctly
- [x] Checking checkbox disables field
- [x] Unchecking checkbox enables field
- [x] Validation skips checked fields
- [x] Step 2 completion considers individual flags
- [x] Progress display shows correct list
- [x] Preview shows placeholders only for checked fields
- [x] Can check any combination of fields
- [x] Can check all fields (same as old behavior)
- [x] Can check no fields (all sender-filled)

### Future Enhancements

1. Add individual checkboxes to Party A fields
2. Update review-nda page to handle individual flags
3. Add "Select All" / "Clear All" quick actions
4. Add tooltips for clarity
5. Save preset patterns (e.g., "Email only", "Contact details only")

---

**HTML Editor Status**: ✅ Individual checkboxes implemented  
**Last Updated**: [Current Date]
