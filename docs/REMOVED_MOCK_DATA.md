# Mock Data Removal - Backend-Only Submissions

## Overview
Removed all mock/test data from the Course Reserves application. The system now exclusively displays submissions fetched from the backend API after user authentication.

## Changes Made

### 1. Removed Initial Test Reserves (`courseReservesStore.ts`)

**Before:**
```typescript
const initialTestReserves: CourseReserve[] = [
  {
    id: "test-1",
    courseCode: "CSC 201",
    courseTitle: "Data Structures",
    // ... 3 test courses with items
  },
  // ... more test data
];
```

**After:**
```typescript
// No initial test data - will load from backend after authentication
const initialTestReserves: CourseReserve[] = [];
```

### 2. Updated Store Initialization

**Before:** Injected test data on initialization
**After:** Starts with empty array, waits for backend data after login

```typescript
reserves: [], // Start empty - will load from backend
```

### 3. Simplified `fetchSubmissions()` Logic

**Before:** Merged test data with backend data
```typescript
const testData = get().reserves.filter(r => r.isTestData);
set({ reserves: [...testData, ...backendReserves] });
```

**After:** Replaces all data with fresh backend submissions
```typescript
// Replace all reserves with fresh backend data (no test data)
set({ reserves: backendReserves });
```

### 4. Updated Persistence Configuration

**Before:** Filtered out test data before persisting
```typescript
partialize: (state) => ({ 
  reserves: state.reserves.filter(reserve => !reserve.isTestData),
})
```

**After:** Persists all backend submissions
```typescript
partialize: (state) => ({ 
  reserves: state.reserves, // All backend data
})
```

### 5. Removed Test Data Checks

**Updated `SubmissionDetail.tsx`:**
- Removed `!reserve.isTestData` check when fetching details
- Removed `reserve.isTestData` check in auto-refresh polling

## New User Flow

### 1. **Login Required**
```
User opens application
  ↓
No courses displayed (empty state)
  ↓
User logs in via AuthDebugPanel
  ↓
Backend fetches submissions for authenticated user
  ↓
Only that user's submissions displayed
```

### 2. **Data Source**
- **Endpoint:** `https://libtools2.smith.edu/course-reserves/backend/web/faculty-submission/index`
- **Method:** GET
- **Authentication:** Bearer token (JWT)
- **Filters:** Automatically filtered by logged-in user's `shibboleth_user_id`

### 3. **Backend Response Structure**
```json
{
  "items": [
    {
      "submission_uuid": "773a5ce9-cb5f-40da-90d8-36154d7340fe",
      "shibboleth_user_id": "ebenz",
      "term_code": "2026 Winter",
      "course_code": "HST 243",
      "course_title": "Colloquium",
      "status": "submitted",
      "faculty_display_name": "Ernest Benz",
      "item_counts": {
        "total": 13,
        "complete": 2,
        "pending": 11
      },
      "materials": [
        {
          "id": "119",
          "title": "Book Title",
          "authors": "Author Name",
          "material_type": "book",
          "is_reuse": true,
          "barcode": "310183603894618",
          "call_number": "DD203 .T8 1915",
          "status": "complete",
          "display_order": 0
        }
        // ... more materials
      ]
    }
  ],
  "meta": {
    "totalCount": 1,
    "page": 1,
    "perPage": 20
  }
}
```

## Testing Process

### Manual Testing Steps

1. **Clear Browser Storage** (to remove any cached test data)
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
   Then refresh the page.

2. **Verify Empty State**
   - Open application
   - Should see "No courses yet" empty state
   - No test courses visible

3. **Login as Faculty Member**
   - Open AuthDebugPanel (debug mode)
   - Enter full name (e.g., "Ernest Benz")
   - Click "Login as Mock User"
   - Backend generates JWT token

4. **Verify Backend Fetch**
   - Console should show: `🔐 User authenticated, fetching submissions...`
   - Console should show: `📦 Fetched submissions from backend:`
   - Console should show: `✅ Updated reserves from backend: { count: X }`

5. **Verify Display**
   - Only courses for the logged-in user should appear
   - Course cards show correct term, status, item counts
   - Clicking a course shows submission details with materials

6. **Test Real-Time Updates**
   - Console shows polling: `🔄 Auto-refreshing submissions...` (every 30s)
   - Changes in backend status should appear automatically

7. **Test Logout**
   - Click "Logout" in AuthDebugPanel
   - Polling stops: `⏸️ Stopping auto-refresh polling`
   - Page returns to empty state or redirects

### Testing Different Users

**Test User 1: Ernest Benz**
```
Login as: Ernest Benz
Expected: See HST 243 submission(s)
```

**Test User 2: Another Faculty**
```
Login as: [Another Name]
Expected: See only their submissions (or empty if none exist)
```

## Benefits

### For Development
✅ **Cleaner codebase** - No mock data maintenance
✅ **Real data testing** - Test with actual backend data
✅ **Accurate UI** - See real submission counts, statuses
✅ **Better debugging** - Console logs show real API responses

### For Production
✅ **Security** - Only authenticated users see their data
✅ **Accuracy** - Real-time data from backend
✅ **Performance** - No unnecessary test data in state
✅ **Privacy** - Users can't see each other's submissions

## Data Flow Diagram

```
┌─────────────────┐
│  User Opens App │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ Empty State Shown  │
│ "No courses yet"   │
└────────┬───────────┘
         │
         ▼
┌─────────────────────┐
│ User Logs In        │
│ (AuthDebugPanel)    │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ Backend: Generate JWT    │
│ Token stored in          │
│ localStorage             │
└────────┬─────────────────┘
         │
         ▼
┌───────────────────────────┐
│ GET /faculty-submission/  │
│ index                     │
│ Authorization: Bearer XX  │
└────────┬──────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Backend returns user's     │
│ submissions                │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Transform to CourseReserve │
│ format                     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Display in UI              │
│ Start polling (30s)        │
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Auto-refresh every 30s     │
│ (silent background fetch)  │
└────────────────────────────┘
```

## API Requirements

### Required Headers
```javascript
{
  'Accept': 'application/json',
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

### Expected Response Fields
- ✅ `submission_uuid` - Used as reserve ID
- ✅ `course_code` - Course identifier
- ✅ `course_title` - Course name
- ✅ `term_code` - Academic term
- ✅ `faculty_display_name` - Instructor name
- ✅ `status` - Submission status (draft/submitted/complete)
- ✅ `materials[]` - Array of course materials
  - `id` - Material ID
  - `title` - Material title
  - `authors` - Material authors
  - `material_type` - Type (book/article/etc)
  - `status` - Material status (pending/complete)
  - `barcode` - Physical item barcode (if applicable)
  - `call_number` - Library call number (if applicable)
  - `display_order` - Sort order

## Troubleshooting

### Problem: No courses showing after login
**Solution:**
1. Check console for API errors
2. Verify JWT token exists: `localStorage.getItem('auth-token')`
3. Check backend endpoint is accessible
4. Verify user has submissions in backend database

### Problem: Seeing old test data
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
3. Check you're on the latest code version

### Problem: Polling not working
**Solution:**
1. Check console for polling logs: `🔄 Auto-refreshing...`
2. Verify user is authenticated
3. Check no JavaScript errors in console

### Problem: Can see other users' data
**Solution:**
- ⚠️ **SECURITY ISSUE** - Backend should filter by authenticated user
- Check backend API returns only current user's submissions
- Verify JWT token is correctly passed in headers

## Migration Notes

### For Existing Deployments
1. ⚠️ **Clear localStorage** on all client browsers after deploying
2. Users will need to re-authenticate
3. All test/mock data will disappear
4. Users will only see their real backend submissions

### Database Requirements
- Backend must have user submissions data
- `shibboleth_user_id` must match logged-in users
- API must enforce user isolation (only return user's own data)

## Related Files Modified
- ✅ `/src/store/courseReservesStore.ts` - Removed test data, updated fetch logic
- ✅ `/src/pages/SubmissionDetail.tsx` - Removed isTestData checks
- ✅ `/src/pages/Index.tsx` - No changes needed (already using store data)

## Security Considerations

### Authentication
✅ **JWT required** - All API calls include Bearer token
✅ **User isolation** - Backend filters by authenticated user
✅ **Token expiration** - 1 hour expiry, auto-logout on expiration

### Data Access
✅ **No shared data** - Users can't see each other's submissions
✅ **No test data leak** - All test data removed from production
✅ **Backend enforcement** - Security enforced at API level, not just UI

## Future Enhancements

### Potential Improvements
- [ ] Add "Refresh" button for manual data reload
- [ ] Add "Last updated" timestamp in UI
- [ ] Implement optimistic UI updates when submitting
- [ ] Add loading skeleton instead of empty state
- [ ] Cache submissions with SWR/React Query for better UX
- [ ] Add error boundary for API failures

### Performance Optimizations
- [ ] Implement incremental updates (only fetch changed data)
- [ ] Add ETag support for conditional requests
- [ ] Implement pagination for users with many submissions
- [ ] Add service worker for offline support
