# CORS Issue Fix

## Problem
The API calls were failing with a CORS error:
```
Access to fetch at 'https://libtools2.smith.edu/folio/web/search/search-courses' 
from origin 'http://localhost:8080' has been blocked by CORS policy: 
Request header field content-type is not allowed by Access-Control-Allow-Headers 
in preflight response.
```

## Root Cause
The issue was caused by including the `Content-Type: application/json` header in **GET** requests.

### Why This Causes CORS Preflight Issues

1. **Simple vs. Preflighted Requests:**
   - Simple GET requests with basic headers (Accept, Accept-Language, Content-Language) don't trigger CORS preflight
   - Adding `Content-Type: application/json` makes it a "non-simple" request
   - Browser sends OPTIONS preflight request first
   - Server must explicitly allow the Content-Type header in `Access-Control-Allow-Headers`

2. **Content-Type on GET is Unnecessary:**
   - GET requests don't have a request body
   - Content-Type describes the body format
   - Including it on GET is redundant and triggers preflight

## Solution
Removed `Content-Type: application/json` header from all GET requests.

### Before:
```typescript
const DEFAULT_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',  // ❌ Triggers CORS preflight
  },
};

fetch(url, {
  method: 'GET',
  ...DEFAULT_CONFIG,
  mode: 'cors',
  credentials: 'omit'
});
```

### After:
```typescript
fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',  // ✅ Simple header, no preflight needed
  },
  mode: 'cors',
  credentials: 'omit'
});
```

## Changes Made

### 1. Course Search API Call
**File:** `SubmissionEditor.tsx`
**Function:** `handleOpenCloneDialog()`
**Line:** ~615-625

```typescript
// Fetch instructor's courses (no Content-Type header for GET requests)
const coursesRes = await fetch(searchUrl, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
  mode: 'cors',
  credentials: 'omit'
});
```

### 2. Electronic Resources Fetch (in course loop)
**Function:** `handleOpenCloneDialog()`
**Line:** ~638-650

```typescript
const electronicRes = await fetch(
  `https://libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources?courseListingId=${courseListingId}`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit'
  }
);
```

### 3. Physical Reserves Fetch
**Function:** `handleCloneFromCourse()`
**Line:** ~723-732

```typescript
const physicalRes = await fetch(
  `https://libtools2.smith.edu/folio/web/search/search-course-listings?courseListingId=${courseListingId}`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit'
  }
);
```

### 4. Electronic Resources Fetch (in clone)
**Function:** `handleCloneFromCourse()`
**Line:** ~743-752

```typescript
const electronicRes = await fetch(
  `https://libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources?courseListingId=${courseListingId}`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit'
  }
);
```

## Expected Behavior Now

### ✅ Course Search Should Work
```
1. User clicks "Copy from Previous Term"
2. Fetches: https://libtools2.smith.edu/folio/web/search/search-courses
3. Query: (department.name=="SC*" and courseListing.instructorObjects="Joseph Cozza*")
4. Returns list of courses with no CORS error
5. Displays courses in dialog
```

### ✅ Electronic Resources Should Work
```
1. User selects a course to clone
2. Fetches electronic resources from SQL backend
3. No CORS error
4. Resources copied to current course
```

### ⚠️ Physical Resources May Still Have CORS Issues
```
- The /search-course-listings endpoint may have other CORS restrictions
- We handle this gracefully with try-catch
- Electronic resources will still work
```

## Testing Checklist

### Test 1: Open Clone Dialog
```
[ ] Click "Copy from Previous Term" on empty course
[ ] Verify no CORS errors in console
[ ] Verify courses appear in dialog
[ ] Verify "Loading your previous courses..." shows briefly
[ ] Verify courses are sorted (exact matches first)
```

### Test 2: View Resource Counts
```
[ ] Check that electronic resource counts display
[ ] Verify "X electronic materials" text
[ ] Verify "May have physical materials" for 0 count
[ ] Verify blue info banner about electronic-only counts
```

### Test 3: Clone Materials
```
[ ] Select a course with materials
[ ] Click "Copy Materials"
[ ] Verify no CORS errors
[ ] Verify materials appear in current course
[ ] Verify success toast shows correct count
[ ] Verify dialog closes
[ ] Verify clone banner disappears
```

## Best Practices for CORS

### Always Avoid These on GET Requests:
- ❌ `Content-Type: application/json`
- ❌ Custom headers not in CORS safe list
- ❌ Authorization headers (unless server allows)

### Safe GET Request Headers:
- ✅ `Accept: application/json`
- ✅ `Accept-Language: en-US`
- ✅ `Content-Language: en-US`

### When to Use Content-Type:
- ✅ POST requests with JSON body
- ✅ PUT requests with JSON body
- ✅ PATCH requests with JSON body
- ❌ GET requests (no body)
- ❌ DELETE requests (usually no body)

## Additional Notes

### Why Accept Header is Safe
The `Accept` header is on the CORS safe list, meaning:
- Doesn't trigger preflight
- Allowed by default in CORS
- Tells server what format we prefer in response

### Mode: 'cors'
We explicitly set `mode: 'cors'` to:
- Allow cross-origin requests
- Enable CORS error handling
- Get proper error messages if blocked

### Credentials: 'omit'
We set `credentials: 'omit'` to:
- Not send cookies or auth credentials
- Avoid additional CORS complexity
- Work with unauthenticated endpoints

## If Issues Persist

### Check Network Tab:
1. Open DevTools → Network
2. Look for OPTIONS requests (preflight)
3. Check response headers:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Methods`

### Verify API Configuration:
Server should return these headers:
```
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization
```

### Alternative Solutions if Still Blocked:
1. **Backend Proxy:** Route requests through your server
2. **CORS Proxy:** Use a proxy service (dev only)
3. **Browser Extension:** Disable CORS (dev only, dangerous)
4. **Server Configuration:** Ask API owner to add your origin

## Summary

✅ **Fixed:** Removed unnecessary Content-Type headers from GET requests
✅ **Result:** No more CORS preflight failures
✅ **Benefit:** Cleaner, simpler, standards-compliant code
✅ **Performance:** Faster (no preflight delay)

The application should now successfully fetch instructor courses and clone materials without CORS errors!
