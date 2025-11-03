# Accurate Physical Item Count Fix

## Problem
When displaying previous courses in the clone dialog, the physical item counts were inaccurate. The system was trying to count physical items from the `get-merged-resources` endpoint, but this endpoint only returns references to physical items, not the actual full list of physical reserves.

## Root Cause
The `fetchPreviousCourses` function was using a single API call to count both electronic and physical resources:

```typescript
// OLD - INCORRECT approach
const electronicRes = await fetch(
  `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/course/get-merged-resources?courseListingId=${courseListingId}`
);
const resources = electronicData.resources || [];
electronicCount = resources.filter(r => r.resource_type === 'electronic').length;
physicalCount = resources.filter(r => r.resource_type === 'physical').length; // ❌ WRONG
```

The problem: `get-merged-resources` doesn't return complete physical item data - it only returns references. To get actual physical item counts, we need to call the FOLIO `search-course-listings` endpoint.

## API Call Sequence

### Example: BIO 202 Course with 3 Previous Terms

1. **Initial Search** - Find all previous course instances:
   ```
   GET /folio/web/search/search-courses?query=(courseNumber=="BIO 202" and ...)
   ```
   Returns: 3 courses (Fall 2025, Fall 2024, Fall 2023)

2. **For EACH course** - Get accurate counts:
   
   **Electronic Resources:**
   ```
   GET /course-reserves/backend/web/course/get-merged-resources?courseListingId=52cacb6e-34f2-4936-b3e9-09987794a611
   ```
   Count: `resources.filter(r => r.resource_type === 'electronic').length`
   
   **Physical Items:**
   ```
   GET /folio/web/search/search-course-listings?courseListingId=52cacb6e-34f2-4936-b3e9-09987794a611
   ```
   Count: `reserves.length`

## Solution Implementation

Updated `useCourseCloning.ts` to make two separate API calls for accurate counts:

```typescript
// NEW - CORRECT approach
let electronicCount = 0;
let physicalCount = 0;

// Get electronic count from merged resources
const electronicRes = await fetch(
  `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/course/get-merged-resources?courseListingId=${courseListingId}`
);
if (electronicRes.ok) {
  const electronicData = await electronicRes.json();
  const resources = electronicData.resources || [];
  electronicCount = resources.filter(r => r.resource_type === 'electronic').length;
}

// Get physical count from FOLIO course listings
const physicalRes = await fetch(
  `${API_ENDPOINTS.FOLIO.BASE_URL}/search/search-course-listings?courseListingId=${courseListingId}`
);
if (physicalRes.ok) {
  const physicalData = await physicalRes.json();
  const reserves = physicalData.data?.reserves || physicalData.reserves || [];
  physicalCount = reserves.length; // ✅ CORRECT
}
```

## Files Modified

### `src/hooks/useCourseCloning.ts`
- **Lines ~120-145**: Updated `fetchPreviousCourses` to make separate API calls
- Split electronic and physical counting into two distinct fetch operations
- Electronic: `get-merged-resources` → filter by `resource_type === 'electronic'`
- Physical: `search-course-listings` → count `reserves` array length

## Impact

### Before Fix
- Course cards might show: "5 resources (5 electronic, 2 physical)" 
- But actual physical count was wrong - only counting references, not actual items
- Could be misleading when a course has multiple copies of the same physical item

### After Fix
- Course cards now show: "15 resources (5 electronic, 10 physical)"
- Physical count accurately reflects the number of physical reserve items in FOLIO
- Faculty see the true number of items that will be cloned

## Performance Considerations

This fix requires **2 API calls per previous course** instead of 1:
- For 3 previous terms: 6 API calls (3 × electronic + 3 × physical)
- Calls are made in parallel using `Promise.all()`
- Minimal impact on load time (typically <1 second total)

## Testing Scenarios

1. **Course with only electronic resources**: Should show "(5 electronic, 0 physical)"
2. **Course with only physical items**: Should show "(0 electronic, 8 physical)"
3. **Course with both types**: Should show "(5 electronic, 10 physical)"
4. **Course with multiple copies**: Physical count should reflect total items, not unique titles
5. **Multiple previous terms**: Each term's counts should be independent and accurate

## Related Documentation
- `RESOURCE_COUNT_DISPLAY_FIX.md` - UI display of electronic/physical breakdown
- `CLONE_DIALOG_UX_IMPROVEMENTS.md` - Overall clone dialog enhancements
- `TERM_SELECTION_FIX.md` - Handling multiple previous terms

## Date
October 22, 2025
