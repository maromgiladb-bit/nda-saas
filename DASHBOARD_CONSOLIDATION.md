# Dashboard Filter Consolidation

## Overview
Consolidated duplicate filter cards and added explicit signing status visibility in the dashboard.

## Changes Made

### 1. Filter Type Consolidation
**File:** `src/app/dashboard/page.tsx`

- **Merged Duplicate Filters**: Combined `PENDING_OWNER_REVIEW` and `WAITING_REVIEW` into single `PENDING_REVIEW` filter
  - Both statuses represent "owner needs to review something"
  - Reduces user confusion about which filter to use
  - Displays combined count of both statuses

- **Added New Filter**: `WAITING_SIGNATURE` 
  - Combines `SENT` and `READY_TO_SIGN` statuses
  - Shows NDAs waiting for recipient to sign
  - Makes signing workflow more visible

### 2. Updated FilterStatus Type
```typescript
type FilterStatus = 
  'ALL' | 
  'DRAFT' | 
  'SENT' | 
  'SIGNED' | 
  'VOID' | 
  'PENDING_REVIEW' |      // New: combines PENDING_OWNER_REVIEW + WAITING_REVIEW
  'WAITING_SIGNATURE'     // New: combines SENT + READY_TO_SIGN
```

### 3. Updated Filter Logic
Modified `getFilteredDrafts()` function to handle consolidated filters:

```typescript
case 'PENDING_REVIEW':
  return drafts.filter(d => 
    d.status === 'PENDING_OWNER_REVIEW' || 
    d.status === 'WAITING_REVIEW'
  )

case 'WAITING_SIGNATURE':
  return drafts.filter(d => 
    d.status === 'SENT' || 
    d.status === 'READY_TO_SIGN'
  )
```

### 4. Updated Dashboard Cards

**Before (6 cards):**
1. Total NDAs
2. Draft
3. Action Needed (PENDING_OWNER_REVIEW only)
4. Waiting Review (WAITING_REVIEW only) ← **Duplicate!**
5. Sent
6. Signed

**After (6 cards):**
1. Total NDAs
2. Draft
3. Pending Review (combines both review statuses) ← **Merged!**
4. Waiting Signature (SENT + READY_TO_SIGN) ← **New!**
5. Sent
6. Signed

### 5. Added "Review & Sign" Action Button

For NDAs with status `SENT` or `READY_TO_SIGN`:
- Shows purple "Review & Sign" button with animation
- Links to `/review-nda/{token}` page
- Finds recipient signer (Party B or Recipient role)
- Uses sign_request token from that signer

```typescript
{(draft.status === 'SENT' || draft.status === 'READY_TO_SIGN') && (
  <Link href={`/review-nda/${signToken}`}>
    Review & Sign
  </Link>
)}
```

## UI/UX Improvements

### Color Coding
- **Pending Review**: Yellow (warning/action needed)
- **Waiting Signature**: Purple (signature workflow)
- **Sent**: Blue (informational)
- **Signed**: Green (success)

### Visual Hierarchy
- Merged "Pending Review" card shows combined count
- "Waiting Signature" card makes signing workflow visible
- Animated pulse on action buttons draws attention
- Consistent icon usage across cards

## Status Mapping

| Database Status | Filter(s) | Action Button |
|----------------|-----------|---------------|
| DRAFT | DRAFT | Edit |
| PENDING_OWNER_REVIEW | PENDING_REVIEW | Review Suggestions |
| WAITING_REVIEW | PENDING_REVIEW | _(none)_ |
| SENT | SENT, WAITING_SIGNATURE | Review & Sign |
| READY_TO_SIGN | WAITING_SIGNATURE | Review & Sign |
| SIGNED | SIGNED | View |
| VOID | VOID | View |

## User Benefits

1. **Less Confusion**: Single "Pending Review" filter instead of two similar ones
2. **Better Visibility**: Explicit "Waiting Signature" status shows signing workflow
3. **Quick Actions**: Direct "Review & Sign" link from dashboard
4. **Clear Counts**: Each filter shows accurate count including merged statuses
5. **Simpler Navigation**: Fewer filter options make dashboard easier to use

## Technical Notes

- No database schema changes required
- Filter logic handles multiple statuses per filter
- Backward compatible with existing draft statuses
- Action buttons conditionally render based on status and signer data
- Token extraction handles multiple signer roles (Party B, Recipient)

## Testing Checklist

- [ ] Click "Pending Review" filter → shows both PENDING_OWNER_REVIEW and WAITING_REVIEW NDAs
- [ ] Click "Waiting Signature" filter → shows SENT and READY_TO_SIGN NDAs
- [ ] "Review & Sign" button appears for NDAs awaiting signature
- [ ] Button links to correct review page with valid token
- [ ] Filter counts update correctly after status changes
- [ ] All existing filters (ALL, DRAFT, SENT, SIGNED) still work
- [ ] Visual animations work smoothly
