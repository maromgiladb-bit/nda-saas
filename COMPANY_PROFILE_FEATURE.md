# Company Profile Auto-Fill Feature

## Overview
Added a comprehensive Company Profile management page that allows users to save their default company information and automatically fill Party A fields in new NDAs, saving time and reducing data entry errors.

## What Was Implemented

### 1. Database Schema
The `company_profile` table already exists in the database with these fields:
- `id` - Primary key
- `userid` - Foreign key to users table
- `companyname` - Company name (required)
- `email` - Company email (required)
- `phone` - Phone number (optional)
- `website` - Website URL (optional)
- `addressline1` - Address line 1 (required)
- `addressline2` - Address line 2 (optional)
- `city` - City (required)
- `state` - State/Province (optional)
- `postalcode` - Postal/ZIP code (optional)
- `country` - Country (required)
- `signatoryname` - Authorized signatory name (required)
- `signatorytitle` - Signatory title (optional)
- `meta` - JSON metadata field (optional)
- `isdefault` - Boolean flag for default profile
- `createdat` - Creation timestamp
- `updatedat` - Update timestamp

### 2. API Endpoints (`/api/company-profile/route.ts`)

#### GET `/api/company-profile`
- Retrieves the user's default company profile
- Returns `{ profile: {...} }` if profile exists
- Returns `{ profile: null }` if no profile exists
- Requires authentication (Clerk)

#### POST `/api/company-profile`
- Creates or updates the user's company profile
- Automatically updates `updatedat` timestamp
- Creates new profile with `id: {userid}_default` if none exists
- Returns `{ success: true, profile: {...}, message: '...' }`
- Requires authentication (Clerk)

### 3. Company Details Page (`/companydetails`)

A comprehensive form with three sections:

#### Section 1: Company Information
- Company Name * (required)
- Email * (required)
- Phone (optional)
- Website (optional)

#### Section 2: Address
- Address Line 1 * (required)
- Address Line 2 (optional)
- City * (required)
- State / Province (optional)
- Postal Code (optional)
- Country * (required)

#### Section 3: Authorized Signatory
- Signatory Name * (required)
- Signatory Title (optional)

#### Features:
- ✅ Professional gradient header with icon
- ✅ Numbered section badges (1, 2, 3)
- ✅ Success/error message banners
- ✅ Loading state while fetching profile
- ✅ Saving state with spinner
- ✅ Auto-hide success message after 3 seconds
- ✅ Responsive grid layout (1 column mobile, 2 columns desktop)
- ✅ Cancel button returns to dashboard
- ✅ All fields have proper validation and placeholders
- ✅ Info box explaining the quick NDA generation benefit

### 4. Auto-Fill Integration in Fill NDA Page (`/fillndahtml`)

#### New Features:
- **"Auto-fill from Profile" Button** in Party A section
  - Green gradient button with lightning bolt icon
  - Shows loading state while fetching
  - Located next to Party A Information heading
  
- **Automatic Field Mapping**:
  - `companyname` → `party_a_name`
  - `addressline1, addressline2, city, state, postalcode, country` → `party_a_address` (formatted as comma-separated string)
  - `signatoryname` → `party_a_signatory_name`
  - `signatorytitle` → `party_a_title`

- **Info Box** below the button:
  - Green background with information icon
  - Explains the auto-fill feature
  - Includes link to Company Details page

#### How It Works:
1. User clicks "Auto-fill from Profile" button
2. Button shows loading spinner
3. Fetches company profile from `/api/company-profile`
4. Automatically formats the address into a single string
5. Updates Party A fields with profile data
6. Console logs success message
7. User can still manually edit any auto-filled fields

### 5. Navigation Integration

The "Company Details" link was already present in the PrivateToolbar navigation:
- Accessible from the main navigation bar
- Available to all authenticated users
- Located between "My Drafts" and "Settings"

## User Workflow

### Setting Up Company Profile (One Time):
1. User navigates to **Company Details** from the navigation menu
2. Fills in their company information (name, address, signatory, etc.)
3. Clicks **"Save Profile"** button
4. Sees success message confirming save
5. Information is now stored for future use

### Creating New NDA with Auto-Fill:
1. User navigates to **Fill NDA** page
2. Fills in Document details (Step 1)
3. Moves to **Party A Information** (Step 2)
4. Clicks **"Auto-fill from Profile"** button
5. All Party A fields are instantly populated
6. User can modify any field if needed
7. Continues to Party B and other steps

## Benefits

✅ **Time Savings**: No need to manually enter company details for every NDA
✅ **Consistency**: Ensures company information is always accurate and formatted correctly
✅ **Error Reduction**: Reduces typos and data entry mistakes
✅ **User Experience**: Streamlined workflow for frequent NDA creators
✅ **Flexibility**: Users can still manually edit fields for special cases
✅ **Professional**: Clean, modern UI with clear visual feedback

## Technical Details

### Database Integration
- Uses Prisma ORM with generated client (`@/generated/prisma`)
- Handles user lookup via Clerk's `external_id` field
- Uses upsert pattern (update if exists, create if not)
- Stores complete address as separate fields for flexibility

### Authentication
- All endpoints protected with Clerk authentication
- Uses `auth()` from `@clerk/nextjs/server`
- Returns 401 if user not authenticated
- Finds internal user ID from Clerk's external ID

### Error Handling
- Try-catch blocks in all async operations
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks if profile doesn't exist

### State Management
- React useState for form data and UI state
- Loading states for async operations
- Optimistic UI updates for better UX
- LocalStorage auto-save integration maintained

## Files Modified

1. **Created**: `src/app/api/company-profile/route.ts`
   - GET and POST endpoints for company profile
   - Authentication and error handling
   - Database operations

2. **Modified**: `src/app/companydetails/page.tsx`
   - Complete rewrite from placeholder to full form
   - ~450 lines of comprehensive UI
   - Form validation and state management

3. **Modified**: `src/app/fillndahtml/page.tsx`
   - Added `loadCompanyProfile()` function
   - Added "Auto-fill from Profile" button
   - Added info box with tip
   - Added address formatting logic

4. **Existing**: `src/components/PrivateToolbar.tsx`
   - Already had "Company Details" navigation link
   - No changes needed

## Testing Checklist

- [ ] Navigate to Company Details page
- [ ] Fill in all required fields (company name, email, address line 1, city, country, signatory name)
- [ ] Fill in optional fields (phone, website, address line 2, state, postal code, signatory title)
- [ ] Click "Save Profile" and verify success message
- [ ] Navigate to Fill NDA page
- [ ] Go to Party A step
- [ ] Click "Auto-fill from Profile" button
- [ ] Verify all Party A fields are populated correctly
- [ ] Verify address is properly formatted with commas
- [ ] Verify you can still manually edit the auto-filled fields
- [ ] Complete NDA creation and verify everything saves correctly
- [ ] Go back to Company Details and update some fields
- [ ] Create new NDA and verify updated fields are used

## Future Enhancements (Optional)

- [ ] Add multiple company profiles (for users with multiple companies)
- [ ] Add company logo upload
- [ ] Add profile selector dropdown in Fill NDA page
- [ ] Add validation for email and website formats
- [ ] Add phone number formatting
- [ ] Add country dropdown with flag icons
- [ ] Add "Copy from Party A to Party B" quick action
- [ ] Add company profile templates/presets
- [ ] Add export/import company profile feature
- [ ] Add profile completeness indicator (progress bar)

## Notes

- The `company_profile` table schema was already in place, no migration needed
- The feature respects the existing localStorage auto-save in Fill NDA page
- Users can have one default profile per user (via `isdefault` flag)
- The ID format is `{userid}_default` for easy identification
- Address formatting includes smart comma placement (skips empty fields)
- All optional fields are set to `null` in database if empty
- The feature is non-intrusive - users can skip auto-fill if preferred
