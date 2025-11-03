# Fresh Submission Data Fix

## Problem
When faculty submitted a course reserve and were redirected to the SubmissionDetail page, two issues occurred:
1. The displayed data was coming from the local store/localStorage cache instead of the freshly submitted data from the backend server
2. The navigation was using the local reserve ID (e.g., `reserve-1761055022037`) instead of the backend-generated UUID (e.g., `be2ef1ed-2c62-4829-8a1b-99040eff3478`)

This caused:
- Old/stale data to be displayed
- 404 errors or incorrect page loads due to wrong ID
- Potential mismatches between what was submitted and what was shown
- Confusion about whether the submission was successful

## Solution
Implemented a two-part fix:
1. Extract the backend-generated submission UUID from the API response
2. Use a query parameter-based refresh mechanism to force fresh data fetch

## Changes Made

### 1. Submission Handlers (`submissionHandlers.ts`)

#### Standard Submission (`confirmSubmit`)
Now extracts the submission UUID from the backend response and navigates to the correct URL:

```typescript
const result = await res.json();
console.group('✅ Submission Completed');
console.log('Response:', result);
console.groupEnd();

// Extract submission UUID from response
const submissionUuid = result?.data?.submission_uuid || result?.submission_uuid || result?.uuid || reserve.id;

// Basic success surface
if (result?.success) {
  toast.success(result?.message || 'Submission completed successfully');
} else {
  toast.success('Submission sent');
}

// Navigate with query param to force fresh data fetch from backend
navigate(`/submission/${submissionUuid}?refresh=true`);
```

**Error Handling**: Falls back to local reserve ID if submission fails:
```typescript
} catch (err) {
  console.error('❌ Submission failed:', err);
  toast.error(`Submission failed: ${(err as Error).message}`);
  // On error, still try to navigate to the detail page
  navigate(`/submission/${reserve.id}?refresh=true`);
}
```

#### Duplicate Submission (`confirmDuplicateSubmit`)
Same changes applied to the duplicate submission flow.

### 2. Submission Detail Page (`SubmissionDetail.tsx`)

#### Import Changes
Added `useSearchParams` hook:
```typescript
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
```

#### State Management
Added search params state:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
```

#### Enhanced Data Loading Logic
Updated the `useEffect` to detect and respond to the refresh parameter:

```typescript
useEffect(() => {
  const loadDetails = async (silent = false) => {
    if (!id) return;
    
    // Check if we need to force refresh from backend (e.g., after fresh submission)
    const shouldRefresh = searchParams.get('refresh') === 'true';
    
    // Only show loading spinner on initial load
    if (!silent) {
      setLoadingDetails(true);
    }
    
    // Always fetch if:
    // 1. Reserve doesn't exist or has no items
    // 2. Doing silent refresh (polling)
    // 3. Refresh param is present (fresh submission)
    if (!reserve || reserve.items.length === 0 || silent || shouldRefresh) {
      const result = await fetchSubmissionDetails(id, silent);
      if (!result && !silent) {
        setNotFound(true);
      }
      
      // Clear the refresh param after fetching
      if (shouldRefresh) {
        searchParams.delete('refresh');
        setSearchParams(searchParams, { replace: true });
      }
    }
    
    if (!silent) {
      setLoadingDetails(false);
    }
  };
  
  // ... rest of effect
}, [id, fetchSubmissionDetails, searchParams, setSearchParams]);
```

## How It Works

### Submission Flow
1. Faculty clicks "Submit to Library" button
2. Confirmation dialog appears
3. Faculty confirms submission
4. Frontend sends data to backend API
5. Backend creates submission and returns response with UUID
6. **Extract submission UUID from response** (e.g., `be2ef1ed-2c62-4829-8a1b-99040eff3478`)
7. Navigate to `/submission/{uuid}?refresh=true` (using backend UUID, not local ID)

### Detail Page Flow
1. SubmissionDetail component mounts with correct UUID
2. Checks for `refresh=true` query parameter
3. If present:
   - Forces a fresh fetch from backend (ignores local cache)
   - Displays loading state while fetching
   - Updates store with fresh server data
   - Removes `?refresh=true` from URL (clean URL)
4. If not present:
   - Uses normal loading logic (can use cache if available)

## UUID Extraction Strategy

The code tries multiple possible response structures to be resilient:

```typescript
const submissionUuid = result?.submission?.submission_uuid ||  // ✅ Correct structure
                      result?.data?.submission_uuid || 
                      result?.submission_uuid || 
                      result?.uuid || 
                      reserve.id; // Fallback to local ID
                      
console.log('📍 Extracted submission UUID:', submissionUuid); // Debug logging
```

This handles various backend response formats:
- `{ submission: { submission_uuid: "..." } }` ✅ **Actual format**
- `{ data: { submission_uuid: "..." } }` ✅
- `{ submission_uuid: "..." }` ✅
- `{ uuid: "..." }` ✅
- Falls back to local ID if none found ✅

### Actual Backend Response Structure:
```json
{
  "success": true,
  "message": "Submission completed successfully",
  "submission": {
    "submission_uuid": "aa957659-8864-4b30-bfb4-48ce631dd994",
    "submission_id": "23",
    "shibboleth_user_id": "jcozza",
    "course_code": "GOV 201",
    "status": "submitted",
    ...
  },
  "stats": { ... }
}
```

## Benefits

✅ **Correct UUID Navigation**: Uses backend-generated UUID instead of local reserve ID  
✅ **Fresh Data**: Always shows the exact data that was submitted to the backend  
✅ **Server Truth**: Ensures UI reflects what the server has stored  
✅ **No Cache Issues**: Bypasses local storage and Zustand store cache  
✅ **Clean URLs**: Query parameter is removed after use for clean URL state  
✅ **Backwards Compatible**: Existing navigation still works normally  
✅ **Error Resilient**: Falls back gracefully if UUID extraction fails  
✅ **Simple Implementation**: Uses standard query parameters, no complex state management

## Testing Checklist

- [x] Submit standard course reserve
- [x] Verify redirect to SubmissionDetail with `?refresh=true`
- [x] Confirm loading indicator appears
- [x] Verify fresh data is fetched from backend
- [x] Check URL parameter is removed after load
- [x] Test duplicate submission flow
- [x] Verify polling continues to work after initial refresh
- [x] Test navigation directly to submission detail (no refresh param)
- [x] Confirm backwards compatibility with existing links

## Technical Notes

- **Why Query Parameters?**: Tried passing state through React Router's `navigate` function, but the type signature in our handlers doesn't support it. Query parameters are simpler and work universally.
- **URL Cleanup**: The `replace: true` option ensures the refresh parameter doesn't create a new history entry, keeping the back button working as expected.
- **Polling Preserved**: The existing 30-second polling for updates continues to work alongside the initial forced refresh.
