# DocuSign Signing Implementation Guide

## Overview
Implements Option 1: **Fill → Review → Sign** workflow
- Party A fills their fields
- If Party B fields exist → Send to Party B to fill (no signing)
- Once ALL fields filled → Both parties review and sign
- Signature methods: DocuSign (electronic) or Manual (print & sign)

## Components Created

### 1. **SignatureBlock Component** (`src/components/SignatureBlock.tsx`)
- Reusable signature section for ANY template
- Displays signature fields for Party A and Party B
- Includes: Signature line, Name, Title, Date
- Has both React component and HTML string export

### 2. **Sign Page** (`src/app/sign-nda/page.tsx`)
- Final review and signing interface
- Two signature methods:
  - **DocuSign**: Electronic signature (recommended)
  - **Manual**: Enter details for print & sign
- Shows complete document with signature block
- Validates all required signature fields

### 3. **DocuSign API** (`src/app/api/send-docusign/route.ts`)
- Sends envelope via DocuSign with signature tabs
- Party A signs first (routing order 1)
- Party B signs second (routing order 2)
- Automatic email notifications to both parties
- Returns envelope ID for tracking

### 4. **Token Management** (`src/lib/docusign.ts`)
- Secure token generation and caching
- Tokens cached for 1 hour
- Never exposed to frontend
- Used by all DocuSign API routes

## Integration Steps for fillndahtml

### Step 1: Update Send Button Logic

In your `fillndahtml` page, modify the send button to check if all fields are filled:

```typescript
const handleSend = () => {
  // Check if there are empty Party B fields
  const emptyPartyBFields = checkPartyBFields(formValues);
  
  if (emptyPartyBFields.length > 0) {
    // Send to Party B for input (existing workflow)
    sendToPartyBForInput();
  } else {
    // All fields filled → Go to signing page
    router.push('/sign-nda?ndaId=' + ndaId);
  }
};
```

### Step 2: Pass Data to Sign Page

When redirecting to sign page, include:
```typescript
router.push(`/sign-nda?ndaId=${ndaId}`);

// Or pass via state/session:
sessionStorage.setItem('ndaData', JSON.stringify({
  formValues,
  htmlContent,
  partyAEmail,
  partyBEmail,
  // ... other data
}));
```

### Step 3: Add Signature Block to Template

Option A: **In HTML Template** (Handlebars)
```handlebars
<!-- At end of your professional_mutual_nda_v1.hbs -->
<div class="signature-block" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #d1d5db;">
  <!-- Signature fields will be here -->
  {{> signatureBlock}}
</div>
```

Option B: **In React Preview** (Before converting to PDF)
```typescript
import { SignatureBlock } from "@/components/SignatureBlock";

<SignatureBlock 
  partyAName={formValues.partyACompanyName}
  partyBName={formValues.partyBCompanyName}
/>
```

Option C: **Inject HTML String** (When generating HTML)
```typescript
import { getSignatureBlockHTML } from "@/components/SignatureBlock";

const htmlWithSignature = htmlContent + getSignatureBlockHTML(
  formValues.partyACompanyName,
  formValues.partyBCompanyName
);
```

### Step 4: Update "Send to Party B" Flow

When Party B has empty fields, send for input ONLY (no signature yet):

```typescript
const sendToPartyBForInput = async () => {
  await fetch('/api/send-for-review', {
    method: 'POST',
    body: JSON.stringify({
      ndaId,
      partyBEmail,
      message: 'Please fill in your details before signing',
      // NO signature request yet
    }),
  });
};
```

### Step 5: After Party B Fills Fields

When Party B completes their fields and sends back:
```typescript
// In Party B's submission handler
const handlePartyBSubmit = async () => {
  await fetch('/api/update-party-b-fields', {
    method: 'POST',
    body: JSON.stringify({ ndaId, partyBFields }),
  });
  
  // Notify Party A that document is ready for signing
  await fetch('/api/notify-ready-for-signature', {
    method: 'POST',
    body: JSON.stringify({ ndaId }),
  });
  
  // Redirect Party A to sign page
  // (via email link or notification)
};
```

## Workflow Diagram

```
Party A fills fields
        ↓
  Are Party B fields empty?
        ↓
    YES → Send to Party B → Party B fills → Notify Party A
        ↓                                           ↓
    NO (or after Party B fills)                     ↓
        ↓                                           ↓
        └──────────────────→ SIGN PAGE ←────────────┘
                                  ↓
                        Choose signing method
                                  ↓
                    ┌─────────────┴─────────────┐
                    ↓                           ↓
              DocuSign                      Manual
                    ↓                           ↓
            Send envelope              Enter signatures
            Both sign remotely         Generate PDF
                    ↓                           ↓
                    └─────────────┬─────────────┘
                                  ↓
                          Signed NDA Complete
```

## Template Compatibility

The signature block is **template-agnostic**:

✅ **Works with:**
- `professional_mutual_nda_v1.hbs`
- `mutual_nda_v1.hbs`
- `design_mutual_nda_v1.hbs`
- ANY future template

**To add to new template:**
Just append signature block HTML at the end (see Step 3 above)

## DocuSign Signature Positioning

Current default positions (adjustable):
- **Party A**: Left side (x: 100, y: 700)
- **Party B**: Right side (x: 350, y: 700)

To customize for your template layout, edit:
`src/app/api/send-docusign/route.ts` lines 48-90

## Environment Variables Required

Already configured in `.env.local`:
```
DOCUSIGN_INTEGRATION_KEY=2fbf8eb6-d013-4149-8d6d-65382942d1ff
DOCUSIGN_USER_ID=7538c367-1bce-4afc-9d34-b90dd5914b18
DOCUSIGN_ACCOUNT_ID=5443dc18-ecae-48ca-82be-da4ec6606829
DOCUSIGN_ENV=demo
```

## Next Steps

1. **Test the sign page**: Visit `/sign-nda` to see the interface
2. **Integrate into fillndahtml**: Add send button logic (Step 1)
3. **Add signature block to templates**: Choose Option A, B, or C (Step 3)
4. **Test DocuSign flow**: Send test envelope
5. **Set up webhooks** (optional): Get notified when signatures complete

## Security Features

✅ Tokens cached server-side only (1 hour)  
✅ Never exposed to frontend  
✅ Automatic renewal when expired  
✅ Credentials in .env.local (gitignored)  
✅ Private key in private.key (gitignored)

## Testing

1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3001/sign-nda`
3. Test both signing methods
4. Check DocuSign dashboard for sent envelopes

## Manual Signature PDF Generation

When user chooses manual signature, you'll need to:
1. Take signature details (name, title, date)
2. Generate PDF with signature fields filled
3. Save to database
4. Send PDF to both parties

Create API route: `src/app/api/sign-nda-manual/route.ts`
(Template provided in sign page component comments)

---

**Ready to integrate?** Start with Step 1 - updating the send button in fillndahtml!
