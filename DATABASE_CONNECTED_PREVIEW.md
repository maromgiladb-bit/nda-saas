# Dashboard Database Integration & PDF Preview System

## Overview
Updated the dashboard to ensure all data is fetched from the database and implemented a local PDF preview system that generates and stores preview PDFs locally.

## Changes Made

### 1. Database Connection ✅
**File:** `src/app/dashboard/page.tsx`

The dashboard was already connected to the database via `/api/ndas/drafts`:
- Fetches all drafts on component mount
- Includes signers with sign_requests data
- Ordered by `updated_at` descending
- Filtered by authenticated user

**No changes needed** - Dashboard already uses database queries.

### 2. Dynamic ViewPDF Route
**Created:** `src/app/viewpdf/[id]/page.tsx`

Proper Next.js dynamic route structure:
- Accepts draft ID as URL parameter: `/viewpdf/[id]`
- Fetches draft data from database via API
- Generates and displays preview PDF
- Includes draft info sidebar
- Shows signers and their status
- Download and edit actions

**Features:**
- Loading states for both draft and PDF generation
- Error handling with retry option
- Responsive layout with PDF viewer and sidebar
- Back to dashboard navigation
- Download PDF button
- Edit draft button (for DRAFT status)

### 3. Preview PDF Generation API
**Created:** `src/app/api/ndas/preview/[id]/route.ts`

Generates PDFs from draft data and saves locally:

**Process:**
1. Authenticate user and verify draft ownership
2. Load draft data from database
3. Process "ask receiver to fill" placeholders
4. Render HTML from Handlebars template
5. Convert HTML to PDF using Puppeteer
6. Save PDF to `tmp/nda-preview-{id}.pdf`
7. Return path to file serving endpoint

**Security:**
- Requires authentication
- Verifies draft ownership
- Only accessible by draft creator

### 4. PDF File Serving API
**Created:** `src/app/api/ndas/preview/[id]/file/route.ts`

Serves locally stored PDF files:

**Process:**
1. Authenticate user
2. Verify draft ownership
3. Read PDF from `tmp/nda-preview-{id}.pdf`
4. Return PDF with proper headers for browser display

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: inline` (display in browser)
- `Cache-Control: no-cache` (always fresh)

### 5. Enhanced Drafts API
**Updated:** `src/app/api/ndas/drafts/[id]/route.ts`

Added sign_requests to signer data:
- Returns active (unconsumed) sign_requests tokens
- Includes token scope
- Ordered by creation date
- Needed for "Review & Sign" buttons

## File Structure

```
src/app/
  viewpdf/
    [id]/
      page.tsx                    # Dynamic route for viewing PDFs
  api/
    ndas/
      drafts/
        [id]/
          route.ts                # GET/PUT/DELETE single draft
      preview/
        [id]/
          route.ts                # Generate preview PDF
          file/
            route.ts              # Serve PDF file
```

## Local PDF Storage

**Location:** `tmp/nda-preview-{draftId}.pdf`

**Why Local Storage:**
- No S3 bucket connected yet
- Instant preview generation
- No external dependencies
- Perfect for development

**File Naming:**
- Format: `nda-preview-{draftId}.pdf`
- Unique per draft
- Easy to manage and cleanup
- Predictable paths

**Future Migration to S3:**
When S3 bucket is connected, update:
1. `src/app/api/ndas/preview/[id]/route.ts` - Upload to S3 instead of local save
2. `src/app/api/ndas/preview/[id]/file/route.ts` - Redirect to S3 URL
3. `prisma/schema.prisma` - Use `preview_key` field in `nda_drafts` table
4. No changes needed to frontend - API contract stays the same

## User Flow

### Viewing a Draft PDF

1. **User clicks "View" on dashboard**
   ```
   /viewpdf/[draftId]
   ```

2. **Page loads draft data**
   ```
   GET /api/ndas/drafts/[id]
   ```
   Returns: Draft with data, signers, status

3. **Page generates preview**
   ```
   GET /api/ndas/preview/[id]
   ```
   - Renders HTML from template
   - Converts to PDF
   - Saves to `tmp/nda-preview-{id}.pdf`
   - Returns: `{ path: '/api/ndas/preview/[id]/file' }`

4. **Page displays PDF**
   ```
   <iframe src="/api/ndas/preview/[id]/file" />
   ```
   - Serves PDF with inline disposition
   - Browser displays PDF natively
   - Download button available

## Database Queries

### Dashboard: Fetch All Drafts
```typescript
GET /api/ndas/drafts
```
**Query:**
```prisma
nda_drafts.findMany({
  where: { created_by_id: user.id },
  orderBy: { updated_at: 'desc' },
  include: {
    signers: {
      select: {
        id, email, role, status, signed_at,
        sign_requests: {
          where: { consumed_at: null },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    }
  }
})
```

### ViewPDF: Fetch Single Draft
```typescript
GET /api/ndas/drafts/[id]
```
**Query:**
```prisma
nda_drafts.findUnique({
  where: { 
    id: draftId,
    created_by_id: user.id 
  },
  include: {
    signers: {
      select: {
        id, email, role, status, signed_at,
        sign_requests: { ... }
      }
    }
  }
})
```

## Security

### Authentication
- All endpoints require Clerk authentication
- `auth()` returns `userId` or null
- Unauthorized requests return 401

### Authorization
- Users can only access their own drafts
- Draft queries include `created_by_id: user.id`
- PDF generation verifies ownership
- PDF serving verifies ownership

### Data Validation
- Draft ID validated via Prisma
- File paths sanitized
- Template data validated

## UI/UX Features

### Loading States
- Skeleton loader while fetching draft
- Spinner while generating PDF
- "Generating PDF preview..." message

### Error Handling
- Draft not found → Error message with back button
- PDF generation failed → Retry button
- PDF file missing → Generate first message

### Visual Design
- Gradient headers (blue to purple)
- Rounded cards with shadows
- Responsive grid layout
- Proper spacing and typography
- Status badges with colors
- Icon buttons with hover effects

### Actions Available
- **View PDF:** Display in iframe
- **Download PDF:** Save to device
- **Edit Draft:** (DRAFT status only)
- **Back to Dashboard:** Easy navigation

## Testing Checklist

- [x] Dashboard fetches all drafts from database
- [x] Draft data includes signers and sign_requests
- [x] View button links to `/viewpdf/[id]`
- [x] ViewPDF page fetches single draft
- [x] PDF generation creates local file
- [x] PDF displays in iframe
- [x] Download button works
- [x] Only draft owner can view
- [x] Error states display properly
- [x] Back navigation works

## Benefits

1. **Database Connected**: All data comes from PostgreSQL via Prisma
2. **Fast Previews**: Local storage = instant generation
3. **Secure**: Authentication + authorization on all endpoints
4. **Scalable**: Easy migration to S3 when ready
5. **User Friendly**: Clean UI with proper loading/error states
6. **Developer Friendly**: Clear API structure, easy to extend

## Next Steps (Future)

1. **Add S3 Integration**
   - Update preview generation to upload to S3
   - Store S3 key in `preview_key` field
   - Serve PDFs from S3 URLs

2. **Add Caching**
   - Cache generated PDFs
   - Only regenerate if draft updated_at changes
   - Cleanup old preview files

3. **Add Watermarks**
   - Add "DRAFT" or "PREVIEW" watermark
   - Different watermarks per status
   - Remove watermark on final version

4. **Add Version History**
   - Track preview generations
   - Allow viewing previous versions
   - Show diff between versions
