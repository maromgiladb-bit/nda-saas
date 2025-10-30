# Shareable Review & Sign Feature

## Overview
Party B (the recipient) can now review, edit their information, and sign NDAs without creating an account. They receive a secure tokenized link via email that gives them access to a public review page.

## User Flow

### For Party A (Sender)
```
1. Create NDA draft
2. Fill in all information including Party B details
3. Click "Send for Signature"
4. Enter Party B's email
5. System generates secure token and sends email
6. Party A receives notification when Party B signs
```

### For Party B (Recipient)
```
1. Receive email with PDF attachment and review link
2. Click link → Opens public review page (no login required)
3. Review all NDA information
4. Edit their own information (name, address, email, title)
5. Save changes if needed
6. Preview PDF to verify everything is correct
7. Sign document by entering full name
8. Confirmation → Party A is notified
```

## Implementation

### 1. Public Review Page
**Location**: `/src/app/review-nda/[token]/page.tsx`

**Features**:
- ✅ No authentication required
- ✅ Public toolbar (not private/logged-in toolbar)
- ✅ Token-based access with expiry (30 days)
- ✅ Read-only view of Party A information
- ✅ Editable Party B information (name, title, address, email)
- ✅ Save changes functionality
- ✅ PDF preview in new tab
- ✅ Digital signature collection
- ✅ Signature date capture
- ✅ Beautiful, professional UI

**Security**:
- Token is 64-character hex string (256 bits of randomness)
- Expires after 30 days
- Single-use option (consumed after signing)
- Scope-based permissions (VIEW, EDIT, SIGN, REVIEW)

### 2. API Endpoints

#### GET `/api/ndas/review/[token]`
Load draft data using secure token.

**Response**:
```json
{
  "draftId": "uuid",
  "templateId": "mutual-nda-v3",
  "formData": { ...all form fields },
  "scope": "REVIEW",
  "signerEmail": "party-b@example.com",
  "signerRole": "Party B",
  "status": "SENT"
}
```

**Error Responses**:
- 404: Invalid token
- 410: Expired or already consumed
- 500: Server error

#### PUT `/api/ndas/review/[token]`
Update Party B information.

**Request**:
```json
{
  "formData": {
    "party_b_name": "Updated Name",
    "party_b_address": "New Address",
    "party_b_email": "new@example.com",
    "party_b_title": "CEO"
  }
}
```

**Features**:
- Creates revision record tracking changes
- Updates `last_actor` to "RECIPIENT"
- Only allows editing if scope permits (EDIT, REVIEW, SIGN)

#### POST `/api/ndas/review/[token]/sign`
Sign the document.

**Request**:
```json
{
  "party_b_signatory_name": "John Smith",
  "signature_date": "2025-10-30"
}
```

**Actions**:
- Updates draft with signature
- Sets status to "READY_TO_SIGN"
- Marks signer as "SIGNED"
- Consumes token (single use)
- Creates revision record
- Stores `provisional_recipient_signed_at` timestamp

### 3. Updated Send Email
**Location**: `/src/app/api/ndas/send/route.ts`

**Changes**:
- ✅ Generates secure token with `REVIEW` scope
- ✅ Creates `sign_requests` record
- ✅ Sets 30-day expiry
- ✅ Email includes `/review-nda/{token}` link
- ✅ Updated email copy to mention "no account required"

**Email Content**:
```
Subject: Please review & sign your NDA – [Document Title]

Body:
Please review the attached NDA document. Click the link below to 
access the agreement, review your information, and sign the document. 
No account required.

[Review & Sign Document Button] → /review-nda/{token}

Attachment: NDA-[id].pdf
```

### 4. Token Scopes

| Scope | View | Edit Party B | Sign | Use Case |
|-------|------|--------------|------|----------|
| VIEW | ✅ | ❌ | ❌ | Read-only preview link |
| EDIT | ✅ | ✅ | ❌ | Allow changes but not signing |
| SIGN | ✅ | ❌ | ✅ | Sign-only (no edits) |
| REVIEW | ✅ | ✅ | ✅ | Full access (default for Party B) |

### 5. Database Schema

The existing schema already supports this feature:

**sign_requests table**:
- `token` (unique) - Secure access token
- `signer_id` - Links to signers table
- `scope` - Permission level (VIEW/EDIT/SIGN/REVIEW)
- `expires_at` - Token expiration
- `consumed_at` - Timestamp when token used (for single-use)
- `editable_fields` - JSON of allowed fields to edit
- `payload` - Additional metadata

**signers table**:
- `draft_id` - Links to NDA draft
- `email` - Party B email
- `role` - "Party B" or custom role
- `status` - PENDING/VIEWED/SIGNED/DECLINED/EXPIRED
- `signed_at` - Timestamp when signed

**nda_drafts table**:
- `last_actor` - OWNER or RECIPIENT
- `provisional_recipient_signed_at` - When Party B signed
- `status` - READY_TO_SIGN after Party B signs

**nda_revisions table**:
- Tracks all changes made by Party B
- Records old vs new values
- Stores actor_role as RECIPIENT

## UI Components

### Review Page Layout

```
┌─────────────────────────────────────┐
│ Public Toolbar (No Login Required)  │
├─────────────────────────────────────┤
│                                     │
│  📄 Review & Sign NDA               │
│  You've been invited to review...   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Document Information          │ │
│  │ - Purpose/Topic (read-only)   │ │
│  │ - Effective Date (read-only)  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Party A (read-only)           │ │
│  │ - Name, Title, Address        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Party B - Your Info ✏️        │ │
│  │ [Editable Fields]             │ │
│  │ • Name *                      │ │
│  │ • Title *                     │ │
│  │ • Address *                   │ │
│  │ • Email *                     │ │
│  │ [Save Changes]                │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✍️ Sign Document              │ │
│  │ Your Full Name (Signature) *  │ │
│  │ [____________]                │ │
│  │ Date: [2025-10-30]           │ │
│  │ [Sign Document]              │ │
│  └───────────────────────────────┘ │
│                                     │
│  [📄 Preview PDF]  [Close]         │
│                                     │
└─────────────────────────────────────┘
```

## Security Considerations

### Token Generation
- Uses Node.js `crypto.randomBytes(32)` for cryptographic randomness
- 256 bits of entropy = ~10^77 possible combinations
- Converted to 64-character hex string

### Token Storage
- Stored hashed? (Currently stored as plain text - consider hashing)
- Indexed for fast lookup
- Expires automatically after 30 days

### Access Control
- Token must exist in database
- Token must not be expired
- Token must not be consumed (for single-use)
- Scope must allow requested action

### Data Protection
- Party B can only edit their own information
- Party A information is read-only
- All changes tracked in revision history
- Email validation on server side

## Testing Steps

1. **Create Draft**:
   - Login as Party A
   - Create new NDA
   - Fill in all information including Party B details
   - Save draft

2. **Send Invitation**:
   - Click "Send for Signature"
   - Enter Party B email
   - Verify email sent with attachment and link

3. **Party B Access** (no login):
   - Open email
   - Click review link
   - Verify public toolbar shows
   - Verify Party A info is read-only
   - Edit Party B information
   - Click "Save Changes"

4. **Preview**:
   - Click "Preview PDF"
   - Verify opens in new tab
   - Verify all information correct

5. **Sign**:
   - Enter signature name
   - Click "Sign Document"
   - Verify success message
   - Verify can't sign twice (token consumed)

6. **Verify Owner Side**:
   - Login as Party A
   - Check draft status changed to "READY_TO_SIGN"
   - Verify Party B signature appears
   - Check revision history for changes

## Future Enhancements

- [ ] Email notification to Party A when Party B signs
- [ ] SMS alternative for token delivery
- [ ] QR code for mobile signing
- [ ] Multi-party signing workflow
- [ ] Reminder emails for pending signatures
- [ ] Signature analytics (time to sign, view duration)
- [ ] Download signed PDF after completion
- [ ] Decline/reject option for Party B
- [ ] Comment/notes from Party B to Party A
- [ ] Mobile-optimized signature experience
- [ ] Biometric signature on mobile devices

## Related Files

**Created**:
- `src/app/review-nda/[token]/page.tsx`
- `src/app/api/ndas/review/[token]/route.ts`
- `src/app/api/ndas/review/[token]/sign/route.ts`
- `SHAREABLE_REVIEW_SIGN_FEATURE.md`

**Modified**:
- `src/app/api/ndas/send/route.ts`

**Existing (Leveraged)**:
- Database: `sign_requests`, `signers`, `nda_drafts`, `nda_revisions`
- Components: `PublicToolbar`, `PDFPreview`
- Libraries: `renderNdaHtml`, `htmlToPdf`, `email`

## Troubleshooting

**Link doesn't work?**
- Check token exists in database
- Verify not expired (30 days)
- Check `consumed_at` is null
- Verify draft still exists

**Can't edit fields?**
- Check token scope is EDIT, SIGN, or REVIEW
- Verify not trying to edit Party A fields
- Check validation errors in console

**Can't sign?**
- Verify token scope allows signing
- Check signature name is not empty
- Verify token not already consumed
- Check signer status in database

**PDF preview not working?**
- Check template ID is valid
- Verify all required fields filled
- Check browser allows popups
- Review server logs for Puppeteer errors

---

**Status**: ✅ Implementation Complete - Ready for Testing
