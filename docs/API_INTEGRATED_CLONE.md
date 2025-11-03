# API-Integrated Clone Workflow

## Overview

The clone functionality in `SubmissionEditor` now integrates with the same external APIs used by `ClonePrevious`, providing a seamless experience for copying materials from previous courses.

## How It Works

### 1. Detection Phase
When a faculty member opens an empty course:
```
- Check if course has 0 items and 0 folders
- If empty, show clone suggestion banner
- Banner is context-aware: knows you're viewing GOV 234
```

### 2. API Integration Phase  
When faculty clicks "Copy from Previous Term":
```
1. Opens dialog
2. Shows "Loading your previous courses..."
3. Calls useCourseSearchStore.searchCoursesByInstructor(faculty.name)
4. Fetches resource counts for each course in parallel
5. Calculates exact matches (same course code)
6. Sorts: Exact matches first, then by term (recent first)
```

### 3. Matching Logic
```typescript
// Exact Match (GOV 234 → GOV 234)
isExactMatch: courseCode === reserve.courseCode

// Shown in green "Exact Matches" section
// Other courses shown in blue "Other Courses" section
```

### 4. Clone Execution
When faculty selects a course:
```
1. Fetches physical reserves from FOLIO API
2. Fetches electronic resources from SQL backend
3. Transforms and adds each to current course
4. Shows success message with count
5. Closes dialog, hides banner
6. Faculty can now edit the materials
```

## User Flow

### Scenario: Faculty teaching GOV 234 (Spring 2026)

```
Step 1: Dashboard
├─ Faculty sees "GOV 234 (Spring 2026)" card
├─ Clicks "Open"
└─ Navigates to editor

Step 2: Editor Loads
├─ Detects: 0 items, 0 folders
├─ Shows blue banner: "Copy Materials from a Previous Term?"
└─ Banner text: "We found previous versions of GOV 234 with materials"

Step 3: Click "Copy from Previous Term"
├─ Dialog opens
├─ Shows loading spinner
├─ Searches API for faculty's courses
└─ Displays results in 2 sections:

    ┌─ Exact Matches (Green) ─────────────────┐
    │ ✓ GOV 234 - Comparative Politics        │
    │   Winter 2026 • 19 materials            │
    │   [Copy Materials]                      │
    │                                         │
    │ ✓ GOV 234 - Comparative Politics        │
    │   Fall 2025 • 15 materials              │
    │   [Copy Materials]                      │
    └─────────────────────────────────────────┘
    
    ┌─ Other Courses (Blue) ──────────────────┐
    │ GOV 301 - Advanced Topics               │
    │   Spring 2025 • 12 materials            │
    │   [Copy Materials]                      │
    │                                         │
    │ GOV 101 - Intro to Government           │
    │   Fall 2024 • 8 materials               │
    │   [Copy Materials]                      │
    └─────────────────────────────────────────┘

Step 4: Faculty Clicks "Copy Materials" on Winter 2026
├─ Button shows "Copying..." with spinner
├─ Fetches 19 materials from API
├─ Adds to current course (GOV 234 Spring 2026)
├─ Dialog closes
├─ Banner disappears
└─ Success: "Cloned 19 materials successfully!"

Step 5: Faculty Edits Materials
├─ All 19 materials now visible in editor
├─ Can edit, reorder, remove items
├─ Can add new materials
└─ Submits when ready
```

## API Endpoints Used

### 1. Search Faculty Courses
```
Trigger: User clicks "Copy from Previous Term"
Store: useCourseSearchStore.searchCoursesByInstructor(name)
Result: List of all faculty's courses
```

### 2. Physical Reserves (FOLIO)
```
URL: https://libtools2.smith.edu/folio/web/search/search-course-listings
Params: ?courseListingId={id}
Returns: Books from library catalog
```

### 3. Electronic Resources (SQL Backend)
```
URL: https://libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources
Params: ?courseListingId={id}  
Returns: Articles, videos, links
```

## Material Transformation

### Physical Reserves → Book Items
```typescript
{
  title: item.title,
  authors: primaryAuthor,
  materialType: 'book',
  status: 'draft',
  publisher: publication.publisher,
  publicationYear: publication.dateOfPublication,
  notes: `Call Number: ${callNumber} | Barcode: ${barcode}`
}
```

### Electronic Resources → Various Types
```typescript
{
  title: resource.title,
  materialType: detectType(url), // 'video', 'article', 'website', 'other'
  status: 'draft',
  url: resource.item_url,
  notes: [description, notes, folder].join(' | ')
}
```

## UI Components

### Clone Banner (Blue Gradient)
```tsx
Location: Top of editor, below instructions
Visibility: Only when course is empty
Style: Blue gradient, copy icon, clear CTAs
Actions:
  - "Copy from Previous Term" → Opens dialog
  - "Start Fresh Instead" → Dismisses banner
```

### Clone Dialog (Full-Screen Modal)
```tsx
Header: "Copy Materials from Previous Course"
Description: "Exact matches for {courseCode} are shown first"
Content:
  - Loading state: Spinner + message
  - Empty state: No courses found
  - Results: Two sections (exact + other)
Sections:
  - Green: Exact matches (same course code)
  - Blue: Other courses (different code)
Each Card Shows:
  - Course number + name
  - Term badge
  - Instructor name
  - Material count
  - "Copy Materials" button
```

## Key Differences from Old Approach

| Aspect | Old (Local Store) | New (API Integration) |
|--------|------------------|----------------------|
| **Data Source** | Local Zustand store | External FOLIO + SQL APIs |
| **Courses Shown** | Only manually created | All faculty's actual courses |
| **Matching** | Simple code comparison | API search by instructor + code match |
| **Materials** | Already in system | Fetched fresh from APIs |
| **Accuracy** | Limited to what's entered | Official registrar data |
| **Scope** | Current term only | All historical terms |

## Benefits

1. **Real Data**: Shows actual courses from registrar, not just what's in the local store

2. **Complete History**: Access to all previous terms, not just what faculty manually entered

3. **Smart Matching**: 
   - Exact matches highlighted in green
   - Other courses shown as alternatives
   - Sorted by relevance

4. **No Duplicates**: Materials copied into existing course, not creating new course

5. **Fresh Content**: Always pulls latest version from APIs

6. **Better UX**:
   - Clear visual distinction (green vs blue)
   - Material counts visible before cloning
   - Progress indicators during fetch/clone
   - Inline in editor (no navigation away)

## Testing

### Test Case 1: Exact Match Exists
```
Setup:
- GOV 234 exists in FOLIO for Winter 2026 with 19 materials
- Create empty GOV 234 for Spring 2026

Steps:
1. Open GOV 234 Spring 2026
2. See banner
3. Click "Copy from Previous Term"
4. See GOV 234 Winter 2026 in green "Exact Matches"
5. Click "Copy Materials"
6. Verify 19 materials appear

Expected:
✓ Banner appears
✓ Winter 2026 shown in green section
✓ Other courses shown in blue section
✓ All 19 materials copied
✓ Banner disappears after copy
```

### Test Case 2: No Exact Match
```
Setup:
- GOV 301 exists in FOLIO
- No previous GOV 234
- Create empty GOV 234 for Spring 2026

Steps:
1. Open GOV 234 Spring 2026
2. See banner
3. Click "Copy from Previous Term"
4. See only blue "Other Courses" section
5. See GOV 301 as alternative

Expected:
✓ No green "Exact Matches" section
✓ GOV 301 shown in blue section
✓ Can still copy from GOV 301 if desired
```

### Test Case 3: No Previous Courses
```
Setup:
- New faculty, no courses in FOLIO
- Create empty GOV 234

Steps:
1. Open GOV 234
2. See banner
3. Click "Copy from Previous Term"
4. See "No Previous Courses Found"

Expected:
✓ Empty state shows
✓ Helpful message displayed
✓ Can close dialog and add materials manually
```

## Error Handling

### API Failures
- If FOLIO API fails: Skip physical reserves, continue with electronic
- If SQL API fails: Skip electronic resources, continue with physical
- If both fail: Show 0 materials, log error
- If count fetch fails: Show "loading" then 0

### Network Issues
- Shows loading state indefinitely
- User can close dialog
- Can retry by reopening dialog

### Partial Success
- If 19 materials exist but only 15 fetch successfully:
  - Copy the 15 that worked
  - Show success message with actual count
  - Log errors for debugging

## Future Enhancements

1. **Preview Before Clone**
   - Show list of materials in dialog
   - Checkboxes to select specific items
   - "Select All" / "Select None" buttons

2. **Smart Filtering**
   - Filter by material type before cloning
   - Exclude outdated items (old editions)
   - Suggest removing broken links

3. **Folder Preservation**
   - Detect folder structure in source
   - Recreate in destination
   - Maintain item-to-folder relationships

4. **Merge Option**
   - If course has some materials, offer merge
   - "Add to existing" vs "Replace all"
   - Duplicate detection

5. **Diff View**
   - Show what changed between terms
   - Highlight new/removed materials
   - Suggest updates

6. **Bulk Operations**
   - Clone multiple courses at once
   - "Clone all from last term"
   - Schedule automatic cloning

## Code Architecture

### State Management
```typescript
const [showCloneSuggestion, setShowCloneSuggestion] = useState(false);
const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
const [loadingPreviousCourses, setLoadingPreviousCourses] = useState(false);
const [previousCourses, setPreviousCourses] = useState([...]);
const [cloningFromCourse, setCloningFromCourse] = useState<string | null>(null);
```

### Key Functions
```typescript
handleOpenCloneDialog()      // Opens dialog, fetches courses
handleCloneFromCourse(id)    // Clones specific course
searchCoursesByInstructor()  // API call to get courses
addItem()                    // Adds material to current course
```

### Data Flow
```
User Action → Open Dialog → Fetch API → Transform Data → Display Results
                                                              ↓
User Selects → Fetch Materials → Transform → Add to Store → Update UI
```

## Performance Considerations

1. **Parallel Fetching**: Resource counts fetched in parallel (Promise.all)
2. **Lazy Loading**: Only fetch materials when user clicks "Copy"
3. **Progress Indicators**: Show loading states to manage expectations
4. **Error Recovery**: Gracefully handle API failures
5. **Caching**: Could cache course list in session storage

## Maintenance Notes

- **API URLs**: Hardcoded, should move to config
- **Type Safety**: Using `any` for API responses (should define interfaces)
- **Error Logging**: Console.error for debugging (add proper error tracking)
- **Auth**: Currently relies on cookies (ensure auth token handling)
