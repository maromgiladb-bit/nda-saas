# Review NDA Page - Required Changes

## Overview
The review-nda page should allow receiving parties to review and respond to NDA without requiring a user account. Access is via a 3-day token sent by email.

## Key Changes Needed

### 1. Component Setup (Lines 1-75)
**Remove:**
- `useUser` and `RedirectToSignIn` imports from Clerk
- `useSearchParams` (not needed - using token from URL params)
- All email suggestions state
- Company profile loading state

**Add:**
- `use` import from React for async params
- Component signature: `function ReviewNDA({ params }: { params: Promise<{ token: string }> })`
- New state variables:
  ```typescript
  const [originalValues, setOriginalValues] = useState<FormValues>(DEFAULTS);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, FieldSuggestion>>({});
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [currentSuggestionField, setCurrentSuggestionField] = useState<string>("");
  ```

**Modify:**
- Change `const [loading, setLoading] = useState(false)` to `useState(true)` - start loading
- Remove unused states: `showSendModal`, `signersEmail`, `sendingForSignature`, `shareableLink`, `showShareLinkModal`, `showSaveConfirmModal`, `showExitWarningModal`

### 2. Load Data from Token (Replace loadCompanyProfile function)
```typescript
// Load NDA data from token on mount
useEffect(() => {
  loadNDAFromToken();
}, [token]);

const loadNDAFromToken = async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/ndas/review/${token}`);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 410) {
        setTokenExpired(true);
      } else {
        setTokenInvalid(true);
      }
      setWarning(data.error || "Invalid or expired link");
      return;
    }

    // Set the form values and store originals
    setValues(data.formData);
    setOriginalValues(data.formData);
    setTemplateId(data.templateId || "mutual_nda_v1");
    setDraftId(data.draftId);
    
    console.log('✅ Loaded NDA from token:', data);
  } catch (error) {
    console.error('Error loading NDA:', error);
    setWarning("Failed to load NDA");
    setTokenInvalid(true);
  } finally {
    setLoading(false);
  }
};
```

### 3. Field State Logic Helper Functions
Add these helper functions to determine field editability:

```typescript
// Check if a Party B field is editable (ask receiver to fill was checked)
const isFieldEditable = (fieldName: string): boolean => {
  const askReceiverFields: Record<string, keyof FormValues> = {
    'party_b_name': 'party_b_name_ask_receiver',
    'party_b_address': 'party_b_address_ask_receiver',
    'party_b_phone': 'party_b_phone_ask_receiver',
    'party_b_signatory_name': 'party_b_signatory_name_ask_receiver',
    'party_b_title': 'party_b_title_ask_receiver',
    'party_b_email': 'party_b_email_ask_receiver',
  };
  
  const askReceiverKey = askReceiverFields[fieldName];
  return askReceiverKey ? values[askReceiverKey] as boolean : false;
};

// Check if any Party A field should show suggest button
const isPartyAField = (fieldName: string): boolean => {
  return fieldName.startsWith('party_a_') || 
         ['docName', 'effective_date', 'term_months', 'confidentiality_period_months', 
          'governing_law', 'ip_ownership', 'non_solicit', 'exclusivity'].includes(fieldName);
};

// Open suggestion modal for a field
const openSuggestionModal = (fieldName: string) => {
  setCurrentSuggestionField(fieldName);
  setShowSuggestionModal(true);
};

// Save suggestion
const saveSuggestion = (suggestedValue: string, comment: string) => {
  setSuggestions(prev => ({
    ...prev,
    [currentSuggestionField]: {
      field: currentSuggestionField,
      currentValue: originalValues[currentSuggestionField as keyof FormValues] as string,
      suggestedValue,
      comment
    }
  }));
  setShowSuggestionModal(false);
  setCurrentSuggestionField("");
};
```

### 4. Update Save Function
Replace the existing save/draft logic:

```typescript
const saveChanges = async () => {
  setSaving(true);
  setWarning("");
  
  try {
    const response = await fetch(`/api/ndas/review/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData: values,
        suggestions: Object.values(suggestions)
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      setWarning(data.error || "Failed to save changes");
      return;
    }
    
    setWarning("✅ Changes saved successfully!");
    setTimeout(() => setWarning(""), 3000);
  } catch (error) {
    console.error('Error saving:', error);
    setWarning("Failed to save changes");
  } finally {
    setSaving(false);
  }
};
```

### 5. Submit for Review Function
Add function to submit filled NDA back to sender:

```typescript
const submitForReview = async () => {
  // Validate required Party B fields that need to be filled
  const requiredFields = ['party_b_name', 'party_b_email', 'party_b_signatory_name'];
  const missingFields = requiredFields.filter(field => 
    isFieldEditable(field) && !values[field as keyof FormValues]
  );
  
  if (missingFields.length > 0) {
    setWarning("Please fill in all required fields before submitting");
    return;
  }
  
  setSaving(true);
  try {
    const response = await fetch(`/api/ndas/review/${token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData: values,
        suggestions: Object.values(suggestions)
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      setWarning(data.error || "Failed to submit");
      return;
    }
    
    // Show success and redirect
    setWarning("✅ NDA submitted successfully! The sender will be notified.");
    setTimeout(() => router.push('/'), 3000);
  } catch (error) {
    console.error('Error submitting:', error);
    setWarning("Failed to submit NDA");
  } finally {
    setSaving(false);
  }
};
```

### 6. Update Input Components
Modify the input rendering to show:
- **Editable fields**: Normal input (white background)
- **Non-editable fields**: Grayed out with "Suggest a change" button

```typescript
const renderField = (
  label: string,
  fieldName: keyof FormValues,
  type: string = "text",
  rows?: number
) => {
  const isEditable = isFieldEditable(fieldName as string);
  const showSuggestButton = !isEditable && isPartyAField(fieldName as string);
  const hasSuggestion = suggestions[fieldName as string];
  
  const InputComponent = rows ? "textarea" : "input";
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {isEditable && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <InputComponent
          type={type}
          rows={rows}
          value={values[fieldName] as string}
          onChange={(e) => isEditable && setValues({...values, [fieldName]: e.target.value})}
          disabled={!isEditable}
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
            isEditable
              ? "border-gray-300 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
          } ${hasSuggestion ? "border-amber-300 bg-amber-50" : ""}`}
          placeholder={isEditable ? `Enter ${label.toLowerCase()}` : ""}
        />
        {showSuggestButton && (
          <button
            type="button"
            onClick={() => openSuggestionModal(fieldName as string)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
          >
            {hasSuggestion ? "✏️ Edit Suggestion" : "💡 Suggest Change"}
          </button>
        )}
      </div>
      {hasSuggestion && (
        <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-semibold text-amber-900">Your suggestion:</p>
          <p className="text-amber-800">{hasSuggestion.suggestedValue}</p>
          {hasSuggestion.comment && (
            <p className="text-amber-700 italic mt-1">{hasSuggestion.comment}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### 7. Add Suggestion Modal Component
Add this modal before the closing return statement:

```tsx
{/* Suggestion Modal */}
{showSuggestionModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Suggest a Change
      </h3>
      <p className="text-gray-600 mb-4">
        Current value: <span className="font-semibold">{originalValues[currentSuggestionField as keyof FormValues] as string || "(empty)"}</span>
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Suggested Value
          </label>
          <input
            type="text"
            id="suggestedValue"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Enter your suggested value"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Comment (optional)
          </label>
          <textarea
            id="suggestionComment"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Explain why you're suggesting this change"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setShowSuggestionModal(false);
            setCurrentSuggestionField("");
          }}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const suggestedValue = (document.getElementById('suggestedValue') as HTMLInputElement).value;
            const comment = (document.getElementById('suggestionComment') as HTMLTextAreaElement).value;
            if (suggestedValue) {
              saveSuggestion(suggestedValue, comment);
            }
          }}
          className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          Save Suggestion
        </button>
      </div>
    </div>
  </div>
)}
```

### 8. Remove Authentication Check
**Find and remove** (around line 665-700):
```typescript
if (!isLoaded) return <div>Loading...</div>;
if (!user) return <RedirectToSignIn />;
```

**Replace with:**
```typescript
// Show loading state
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicToolbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading NDA...</p>
        </div>
      </div>
    </div>
  );
}

// Show error states
if (tokenExpired) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicToolbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-6">
            This review link has expired. Review links are valid for 3 days.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the sender to request a new review link.
          </p>
        </div>
      </div>
    </div>
  );
}

if (tokenInvalid) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicToolbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600">
            This review link is invalid or has been revoked.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 9. Update Action Buttons
Replace the final action buttons section with:

```tsx
<div className="flex gap-4 justify-between">
  <button
    type="button"
    onClick={() => window.history.back()}
    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
  >
    ← Back
  </button>
  <div className="flex gap-3">
    <button
      type="button"
      onClick={saveChanges}
      disabled={saving}
      className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl font-bold hover:bg-teal-200 transition-all disabled:opacity-50"
    >
      {saving ? "Saving..." : "💾 Save Draft"}
    </button>
    <button
      type="button"
      onClick={submitForReview}
      disabled={saving}
      className="px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
    >
      {saving ? "Submitting..." : "✅ Submit for Review"}
    </button>
  </div>
</div>
```

## Summary of Changes
1. ✅ Remove Clerk authentication - page is public with token-based access
2. ✅ Load NDA data from token API endpoint
3. ✅ Store original values to compare changes
4. ✅ Implement field editability logic (ask_receiver flags)
5. ✅ Add suggestions system for non-editable fields
6. ✅ Gray out filled fields, enable "ask receiver" fields
7. ✅ Add "Suggest a change" button for grayed fields
8. ✅ Save changes and suggestions back to server
9. ✅ Submit completed NDA back to sender
10. ✅ Show appropriate error states (expired/invalid token)
