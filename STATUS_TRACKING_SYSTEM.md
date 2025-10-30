# NDA Status Tracking System - Complete Implementation

## Overview
Comprehensive status tracking system that updates the database and dashboard in real-time based on all NDA actions.

## Status Flow Diagram

```
┌──────────┐
│  DRAFT   │ Initial creation
└────┬─────┘
     │ Send to Party B
     ▼
┌──────────┐
│   SENT   │ Awaiting Party B action
└────┬─────┘
     │
     ├─── Party B Signs ────────► SIGNED (Complete)
     │
     └─── Party B Suggests ─────┐
                                 ▼
                    ┌────────────────────────┐
                    │ PENDING_OWNER_REVIEW   │ Action needed by Party A
                    └────────┬───────────────┘
                             │
                             ├─── Party A Accepts ────► SENT (Back to Party B)
                             │
                             └─── Party A Rejects ────► SENT (Back to Party B)
```

## All Status States

### 1. **DRAFT**
- **Meaning**: NDA is being created, not yet sent
- **Who Sees**: Creator only
- **Actions Available**: Edit, Preview, Send
- **Dashboard Color**: Gray
- **Icon**: Pencil
- **Updated When**: 
  - New NDA created (`/api/ndas/drafts` POST)
  - Draft saved (`/api/ndas/drafts/[id]` PUT)

### 2. **SENT**
- **Meaning**: NDA sent to Party B, awaiting their action
- **Who Sees**: Creator and Party B
- **Actions Available**: View, (Party B: Edit own fields, Sign, Suggest)
- **Dashboard Color**: Purple/Blue
- **Icon**: Send arrow
- **Updated When**:
  - Send for signature (`/api/ndas/send` POST)
  - Party A applies suggestions (`/api/ndas/review-suggestions/[token]/apply` POST)

### 3. **PENDING_OWNER_REVIEW**
- **Meaning**: Party B suggested changes, awaiting Party A review
- **Who Sees**: Creator (Party A)
- **Actions Available**: Review Suggestions, Accept/Reject changes
- **Dashboard Color**: Yellow (Action Needed)
- **Icon**: Warning/Alert triangle
- **Dashboard Label**: "Waiting for Your Review"
- **Updated When**:
  - Party B suggests changes (`/api/ndas/review/[token]/suggest` POST)

### 4. **SIGNED**
- **Meaning**: Document fully executed by all parties
- **Who Sees**: Creator and Signers
- **Actions Available**: View, Download
- **Dashboard Color**: Green
- **Icon**: Checkmark
- **Updated When**:
  - Party B signs document (`/api/ndas/review/[token]/sign` POST)

### 5. **VOID**
- **Meaning**: Document cancelled or expired
- **Who Sees**: Creator
- **Actions Available**: View only
- **Dashboard Color**: Red
- **Icon**: X or Stop
- **Updated When**: Manual void action (API to be implemented)

### 6. **NEEDS_RECIPIENT_CHANGES**
- **Meaning**: Party A requested Party B make changes
- **Who Sees**: Both parties
- **Actions Available**: Party B can edit
- **Dashboard Color**: Orange
- **Updated When**: Party A rejects and requests changes

### 7. **READY_TO_SIGN**
- **Meaning**: All edits complete, ready for final signature
- **Who Sees**: Signer
- **Actions Available**: Sign
- **Dashboard Color**: Teal/Cyan
- **Updated When**: After review loop, before signing

### 8. **WAITING_REVIEW**
- **Meaning**: General review pending (legacy status)
- **Who Sees**: Relevant parties
- **Actions Available**: Review
- **Dashboard Color**: Purple
- **Updated When**: Legacy workflows

## API Endpoints & Status Updates

### 1. Create Draft
**Endpoint**: `POST /api/ndas/drafts`
**Status Set**: `DRAFT`
**Code**:
```typescript
await prisma.nda_drafts.create({
  data: {
    status: "DRAFT",
    last_actor: "OWNER"
  }
})
```

### 2. Save/Update Draft
**Endpoint**: `PUT /api/ndas/drafts/[id]`
**Status Maintained**: `DRAFT`
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id },
  data: {
    data: formData,
    updated_at: new Date(),
    last_actor: "OWNER"
  }
})
```

### 3. Send for Signature
**Endpoint**: `POST /api/ndas/send`
**Status Change**: `DRAFT` → `SENT`
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id: draftId },
  data: {
    status: "SENT",
    last_actor: "OWNER",
    updated_at: new Date()
  }
})
```

### 4. Party B Reviews/Edits
**Endpoint**: `PUT /api/ndas/review/[token]`
**Status Maintained**: `SENT` (no change until action taken)
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id: draft.id },
  data: {
    data: formData,
    last_actor: "RECIPIENT",
    updated_at: new Date()
  }
})
```

### 5. Party B Suggests Changes
**Endpoint**: `POST /api/ndas/review/[token]/suggest`
**Status Change**: `SENT` → `PENDING_OWNER_REVIEW`
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id: draft.id },
  data: {
    status: "PENDING_OWNER_REVIEW",
    last_actor: "RECIPIENT",
    updated_at: new Date()
  }
})
```

### 6. Party A Reviews Suggestions
**Endpoint**: `POST /api/ndas/review-suggestions/[token]/apply`
**Status Change**: `PENDING_OWNER_REVIEW` → `SENT`
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id: draft.id },
  data: {
    data: updatedData,
    updated_at: new Date(),
    last_actor: "OWNER",
    status: "SENT" // Send back to Party B
  }
})
```

### 7. Party B Signs Document
**Endpoint**: `POST /api/ndas/review/[token]/sign`
**Status Change**: `SENT` → `SIGNED`
**Code**:
```typescript
await prisma.nda_drafts.update({
  where: { id: draft.id },
  data: {
    status: "SIGNED",
    last_actor: "RECIPIENT",
    updated_at: new Date()
  }
})

await prisma.signers.update({
  where: { id: signer.id },
  data: {
    status: "SIGNED",
    signed_at: new Date()
  }
})
```

## Dashboard Updates

### Stats Cards (6 total)
1. **Total NDAs** - All statuses
2. **Draft** - Gray, pencil icon
3. **Action Needed** - Yellow, warning icon (PENDING_OWNER_REVIEW)
4. **Waiting Review** - Purple, eye icon
5. **Sent** - Purple, send icon
6. **Signed** - Green, checkmark icon

### Status Labels & Colors
```typescript
const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DRAFT': return 'bg-gray-100 text-gray-800'
    case 'SENT': return 'bg-blue-100 text-blue-800'
    case 'SIGNED': return 'bg-green-100 text-green-800'
    case 'VOID': return 'bg-red-100 text-red-800'
    case 'PENDING_OWNER_REVIEW': return 'bg-yellow-100 text-yellow-800'
    case 'WAITING_REVIEW': return 'bg-purple-100 text-purple-800'
    case 'NEEDS_RECIPIENT_CHANGES': return 'bg-orange-100 text-orange-800'
    case 'READY_TO_SIGN': return 'bg-teal-100 text-teal-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDING_OWNER_REVIEW': return 'Waiting for Your Review'
    case 'NEEDS_RECIPIENT_CHANGES': return 'Needs Changes'
    case 'READY_TO_SIGN': return 'Ready to Sign'
    case 'WAITING_REVIEW': return 'Waiting Review'
    default: return status
  }
}
```

### Action Buttons by Status

#### DRAFT
```tsx
<Link href={`/fillnda?draftId=${draft.id}`}>
  Edit
</Link>
```

#### PENDING_OWNER_REVIEW
```tsx
<Link 
  href={`/review-suggestions/${reviewToken}`}
  className="animate-pulse" // Draws attention
>
  Review Suggestions
</Link>
```

#### SENT
```tsx
<Link href={`/viewpdf/${draft.id}`}>
  View
</Link>
```

#### SIGNED
```tsx
<Link href={`/viewpdf/${draft.id}`}>
  View
</Link>
<button>Download PDF</button>
```

## Database Schema

### nda_drafts Table
```typescript
status: draft_status @default(DRAFT)
last_actor: ActorRole // OWNER or RECIPIENT
updated_at: DateTime
```

### draft_status Enum
```typescript
enum draft_status {
  DRAFT
  SENT
  SIGNED
  VOID
  PENDING_OWNER_REVIEW
  NEEDS_RECIPIENT_CHANGES
  READY_TO_SIGN
  WAITING_REVIEW
}
```

### ActorRole Enum
```typescript
enum ActorRole {
  OWNER       // Party A, creator
  RECIPIENT   // Party B, signer
}
```

## Status Tracking Best Practices

### 1. Always Update Both Fields
```typescript
await prisma.nda_drafts.update({
  where: { id },
  data: {
    status: "NEW_STATUS",
    last_actor: "OWNER" | "RECIPIENT",
    updated_at: new Date()
  }
})
```

### 2. Create Revision Records
```typescript
await prisma.nda_revisions.create({
  data: {
    draft_id: draft.id,
    number: revisionNumber,
    actor_role: "OWNER" | "RECIPIENT",
    base_form: oldData,
    new_form: newData,
    diff: changes,
    message: "Status change description"
  }
})
```

### 3. Update Signer Status
```typescript
await prisma.signers.update({
  where: { id: signer.id },
  data: {
    status: "SIGNED" | "PENDING" | "VIEWED",
    signed_at: new Date() // if signed
  }
})
```

### 4. Mark Tokens as Consumed
```typescript
await prisma.sign_requests.update({
  where: { id: signRequest.id },
  data: {
    consumed_at: new Date()
  }
})
```

## Real-Time Dashboard Updates

### Fetching Updated Data
```typescript
const fetchDrafts = async () => {
  const response = await fetch('/api/ndas/drafts')
  const data = await response.json()
  setDrafts(data.drafts)
}

// Call after any action
useEffect(() => {
  fetchDrafts()
}, [])
```

### Including Tokens for Actions
```typescript
const drafts = await prisma.nda_drafts.findMany({
  include: {
    signers: {
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        sign_requests: {
          where: { consumed_at: null },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            token: true,
            scope: true
          }
        }
      }
    }
  }
})
```

## Testing Checklist

### Status Transitions
- [ ] Create draft → Status = DRAFT
- [ ] Save draft → Status stays DRAFT
- [ ] Send NDA → Status = SENT
- [ ] Party B edits → Status stays SENT
- [ ] Party B suggests → Status = PENDING_OWNER_REVIEW
- [ ] Party A reviews → Status = SENT
- [ ] Party B signs → Status = SIGNED
- [ ] Dashboard shows correct counts
- [ ] Filter buttons work for all statuses
- [ ] Action buttons appear correctly
- [ ] Status labels are user-friendly
- [ ] Colors are consistent
- [ ] Timestamps update correctly

### Dashboard Display
- [ ] DRAFT shows "Edit" button
- [ ] PENDING_OWNER_REVIEW shows "Review Suggestions" (pulsing)
- [ ] SENT shows recipient email
- [ ] SIGNED shows completion date
- [ ] Stats cards count correctly
- [ ] Filters work independently
- [ ] Search works across statuses
- [ ] Refresh shows updated statuses

### Email Notifications
- [ ] Send email includes correct status context
- [ ] Suggestion email explains PENDING_OWNER_REVIEW
- [ ] Applied changes email re-establishes SENT
- [ ] Signed email confirms SIGNED status

## Files Modified

1. **src/app/dashboard/page.tsx**
   - Added PENDING_OWNER_REVIEW filter card
   - Added getStatusLabel() function
   - Updated getStatusColor() with all statuses
   - Added "Review Suggestions" button for PENDING_OWNER_REVIEW
   - Updated interface to include sign_requests
   - Changed grid from 5 to 6 columns

2. **src/app/api/ndas/drafts/route.ts**
   - Added sign_requests to include query
   - Fetches unconsumed tokens for action buttons

3. **prisma/schema.prisma** (already had correct enums)
   - draft_status enum with all 8 states
   - ActorRole enum (OWNER, RECIPIENT)

## Status Update Guarantees

Every action that changes an NDA MUST:
1. ✅ Update `status` field in `nda_drafts`
2. ✅ Update `last_actor` field
3. ✅ Update `updated_at` timestamp
4. ✅ Create `nda_revisions` record (if data changed)
5. ✅ Send appropriate email notification
6. ✅ Update signer status if applicable
7. ✅ Mark tokens as consumed if one-time use

## Monitoring & Debugging

### Check Current Status
```sql
SELECT id, title, status, last_actor, updated_at 
FROM nda_drafts 
ORDER BY updated_at DESC;
```

### Count by Status
```sql
SELECT status, COUNT(*) 
FROM nda_drafts 
GROUP BY status;
```

### Recent Status Changes
```sql
SELECT 
  nd.title,
  nr.actor_role,
  nr.message,
  nr.created_at
FROM nda_revisions nr
JOIN nda_drafts nd ON nr.draft_id = nd.id
ORDER BY nr.created_at DESC
LIMIT 10;
```

### Pending Reviews
```sql
SELECT 
  nd.id,
  nd.title,
  nd.status,
  s.email as owner_email,
  sr.token,
  sr.expires_at
FROM nda_drafts nd
JOIN signers s ON s.draft_id = nd.id AND s.role = 'Owner Review'
JOIN sign_requests sr ON sr.signer_id = s.id
WHERE nd.status = 'PENDING_OWNER_REVIEW'
  AND sr.consumed_at IS NULL
  AND sr.expires_at > NOW();
```

## Future Enhancements

1. **Auto-Expiry**: Change SENT → VOID after X days
2. **Reminder Emails**: Nudge for PENDING_OWNER_REVIEW
3. **Status History**: Timeline view in dashboard
4. **Webhooks**: Notify external systems of status changes
5. **Analytics**: Time in each status, conversion rates
6. **Bulk Actions**: Change multiple NDAs status at once
7. **Custom Statuses**: User-defined workflow states
8. **Status Locks**: Prevent certain transitions
9. **Approval Chains**: Multi-step PENDING states
10. **Status Rollback**: Undo status changes
