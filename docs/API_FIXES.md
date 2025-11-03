# API Integration Fixes

## Issues Identified & Fixed

### 1. Wrong API Endpoint for Course Search

**Problem:**
- Was using `useCourseSearchStore.searchCoursesByInstructor()` which didn't match the actual API
- The real API is: `https://libtools2.smith.edu/folio/web/search/search-courses?query=...`

**Solution:**
Built the correct query URL directly:
```typescript
const query = `(department.name=="SC*" and courseListing.instructorObjects="${user.full_name}*") sortby name`;
const searchUrl = `https://libtools2.smith.edu/folio/web/search/search-courses?query=${encodeURIComponent(query)}`;
```

**API Response Structure:**
```json
{
  "message": "success",
  "code": 200,
  "data": {
    "courses": [
      {
        "id": "course-id",
        "name": "Course Name",
        "courseNumber": "GOV 234",
        "courseListingId": "listing-id",
        "courseListingObject": {
          "termObject": {
            "name": "2025 Fall"
          },
          "instructorObjects": [
            {
              "name": "Joseph Cozza"
            }
          ]
        }
      }
    ]
  }
}
```

### 2. CORS Error on Physical Reserves Endpoint

**Problem:**
- `https://libtools2.smith.edu/folio/web/search/search-course-listings?courseListingId=...` returns CORS error
- Cannot fetch physical book reserves from this endpoint

**Solution:**
Graceful degradation:

```typescript
// Try to fetch physical reserves, but don't fail if CORS blocks it
try {
  const physicalRes = await fetch(physicalReservesUrl, {...});
  if (physicalRes.ok) {
    physicalReserves = await physicalRes.json();
  }
} catch (error) {
  console.log('Physical reserves unavailable (CORS issue):', error);
  // Continue without physical reserves
}
```

### 3. Resource Count Display

**Problem:**
- Can only count electronic resources (SQL API works)
- Physical reserves can't be counted due to CORS
- Showing "0 materials" was misleading

**Solution:**
Updated UI to be transparent:

1. **Info Banner:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
  <p className="text-sm text-blue-700">
    <strong>Note:</strong> Resource counts shown are electronic materials only. 
    Physical books will also be copied when available.
  </p>
</div>
```

2. **Per-Course Display:**
```tsx
{course.resourceCount > 0 ? (
  <><strong>{course.resourceCount}</strong> electronic materials</>
) : (
  <>May have physical materials</>
)}
```

## What Works Now

### ✅ Course Search
- Searches by instructor name
- Filters by department (SC*)
- Returns all instructor's courses
- Sorted by name

### ✅ Electronic Resources
- Fetches from SQL backend: `get-merged-resources`
- Counts and displays correctly
- Clones successfully (articles, videos, websites)

### ✅ Physical Resources (Partial)
- **During Clone:** Still attempts to fetch and will copy if available
- **During Count:** Gracefully skips due to CORS
- **UI:** Doesn't show count, but mentions "may have physical materials"

### ✅ Exact Match Detection
- Compares `course.courseNumber` with `reserve.courseCode`
- Shows exact matches in green section first
- Other courses in blue section below

## Complete Flow

### 1. User Opens Empty Course
```
GOV 234 (Spring 2026)
0 items, 0 folders
→ Shows clone banner
```

### 2. User Clicks "Copy from Previous Term"
```
1. Opens dialog
2. Builds query: (department.name=="SC*" and courseListing.instructorObjects="Joseph Cozza*")
3. Fetches: https://libtools2.smith.edu/folio/web/search/search-courses?query=...
4. Gets courses: GOV 234, GOV 201, GOV 301, etc.
5. For each course:
   - Try to fetch electronic resources (SQL API) ✅
   - Skip physical count (CORS blocks) ⚠️
   - Determine if exact match (GOV 234 === GOV 234)
6. Sort: Exact matches first, then by term
7. Display in two sections (green = exact, blue = other)
```

### 3. User Selects Course to Clone
```
Clicks "Copy Materials" on GOV 234 (Fall 2025)

1. Try to fetch physical reserves (may fail CORS) ⚠️
2. Fetch electronic resources ✅
3. Process physical if available:
   - Extract title, author, publisher, call number
   - Create 'book' type items
4. Process electronic:
   - Detect type (video/article/website/other)
   - Extract URL, notes, folder info
   - Create appropriate items
5. Add all to current course
6. Show success: "Cloned 15 materials successfully!"
```

## API Endpoints Reference

### 1. Search Courses (Working)
```
URL: https://libtools2.smith.edu/folio/web/search/search-courses
Method: GET
Query: ?query=(department.name=="SC*" and courseListing.instructorObjects="Name*") sortby name
Response: { data: { courses: [...] } }
```

### 2. Electronic Resources (Working)
```
URL: https://libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources
Method: GET  
Query: ?courseListingId={id}
Response: { resources: [...] }
```

### 3. Physical Reserves (CORS Issue)
```
URL: https://libtools2.smith.edu/folio/web/search/search-course-listings
Method: GET
Query: ?courseListingId={id}
Response: CORS error (blocked by browser)
Status: ⚠️ Not accessible from browser, but may work server-side
```

## Workarounds in Place

### For Resource Counting
- **Show:** Electronic resource count
- **Message:** "Note: Resource counts shown are electronic materials only"
- **Fallback:** "May have physical materials" when count is 0

### For Cloning
- **Try:** Fetch physical reserves
- **Catch:** CORS error silently
- **Continue:** With electronic only if needed
- **Success:** Show actual count cloned (whatever worked)

### For Empty Results
- Don't filter out courses with 0 electronic resources
- They may still have physical books (just can't count them)
- Let user attempt clone anyway

## Testing Recommendations

### Test Case 1: Course with Electronic Resources
```
Setup: GOV 234 has 10 articles in SQL database
Expected:
  ✓ Shows "10 electronic materials"
  ✓ Clone button works
  ✓ All 10 articles copied
  ✓ Plus any physical books if available
```

### Test Case 2: Course with Only Physical Books
```
Setup: GOV 201 has 5 books, 0 electronic
Expected:
  ✓ Shows "May have physical materials"
  ✓ Clone button still visible
  ✓ Attempts clone
  ✓ Copies books IF CORS allows (otherwise graceful failure)
```

### Test Case 3: No Resources
```
Setup: GOV 301 has no materials
Expected:
  ✓ Shows "May have physical materials"
  ✓ Clone button available
  ✓ Shows toast: "No materials found to copy"
```

### Test Case 4: Mixed Resources
```
Setup: GOV 234 has 8 articles + 12 books
Expected:
  ✓ Shows "8 electronic materials"
  ✓ Clone copies 8 articles for sure
  ✓ Clone MAY copy 12 books (CORS dependent)
  ✓ Success message shows actual count
```

## Future Improvements

### Option 1: Proxy Server
Create a backend endpoint to proxy physical reserves:
```
Your Server → FOLIO API (no CORS)
Browser → Your Server (CORS enabled)
```

### Option 2: Server-Side Search
Move entire search to backend:
```
POST /api/clone/search
  { instructor: "Joseph Cozza", currentCourse: "GOV 234" }

Returns:
  { courses: [...], resources: [...], counts: {...} }
```

### Option 3: Two-Stage Process
1. Show courses (no counts)
2. When user selects, then fetch full details
3. Show preview before cloning

### Option 4: Cached Counts
Store resource counts in your database when courses are created/updated
Avoid fetching on every search

## TypeScript Warnings to Fix

Current `any` types that need proper interfaces:

1. `courses.map(async (course: any) => {` 
   → Define `FOLIOCourse` interface

2. `physicalReserves: any[]`
   → Define `PhysicalReserve` interface

3. `electronicResources: any[]`
   → Define `ElectronicResource` interface

4. `reserve.copiedItem` and `item.contributors`
   → Define nested interfaces

Example interfaces needed:

```typescript
interface FOLIOCourse {
  id: string;
  name: string;
  courseNumber: string;
  courseListingId: string;
  courseListingObject: {
    id: string;
    termObject: {
      name: string;
    };
    instructorObjects: Array<{
      name: string;
    }>;
  };
}

interface PhysicalReserve {
  copiedItem: {
    title: string;
    callNumber: string;
    barcode: string;
    contributors?: Array<{
      name: string;
      primary?: boolean;
    }>;
    publication?: Array<{
      publisher: string;
      dateOfPublication: string;
    }>;
  };
}

interface ElectronicResource {
  title: string;
  item_url: string;
  description?: string;
  external_note?: string;
  internal_note?: string;
  folder_name?: string;
}
```

## Summary

The integration now:
- ✅ Uses correct API endpoint for course search
- ✅ Handles CORS errors gracefully
- ✅ Shows transparent messaging about limitations  
- ✅ Successfully clones electronic resources
- ✅ Attempts physical resources (may work server-side later)
- ✅ Provides clear user feedback
- ⚠️ Needs TypeScript interfaces
- ⚠️ May need backend proxy for physical reserves
