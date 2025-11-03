# UX Improvements V2 - Single Modal with Views

## Changes Made

### 1. Department Filter Fixed
**Issue:** Search was using dynamic department extraction which didn't work well  
**Solution:** Changed all searches to use `SC*` (Smith College wildcard) consistently

```typescript
// Before
const match = reserve.courseCode.match(/^([A-Z]+)\s*(\d+[A-Z]?)/);
const department = match ? match[1] : 'SC';
query = `(department.name=="${department}*" ...)`

// After  
query = `(department.name=="SC*" ...)`
```

### 2. Direct Resource Access for Exact Matches
**Issue:** Clicking "View {COURSE} History" showed course list again, requiring extra click  
**Solution:** Button now directly loads ALL resources from ALL exact match course versions

**User Flow:**
1. Faculty opens GOV 201 Spring 2025 editor
2. System finds GOV 201 Fall 2024, GOV 201 Spring 2024, GOV 201 Fall 2023
3. Click "View GOV 201 Resources" →  **DIRECTLY** shows combined list of all resources from those 3 terms
4. Can immediately browse, preview, and add individual resources or add all

**Technical Implementation:**
- Button calls `handleOpenCloneDialog('exact', true)` (new `directToResources` parameter)
- When `directToResources=true`, automatically calls `loadResourcesFromMultipleCourses()`
- Fetches resources from ALL exact match courses in parallel
- Combines into single unified list with "From: [Term]" tags
- Shows in resource view immediately (skips course list)

### 3. Single Large Modal with View Switching
**Issue:** Multiple nested modals (course dialog → preview dialog) were confusing and small  
**Solution:** One large modal that switches between two views

**Modal Specifications:**
- Size: `max-w-6xl` (was `max-w-4xl`) - 50% wider
- Height: `max-h-[90vh]` (was `max-h-[80vh]`) - more vertical space  
- Layout: `flex flex-col` with `flex-1 overflow-y-auto` for proper scrolling
- Views: 'courses' or 'resources' controlled by `dialogView` state

**View 1: Course List**
- Shows when "Browse All My Courses" is clicked
- Lists all courses with Preview and Add All buttons
- Clicking Preview → switches to resource view for that single course

**View 2: Resources**
- Shows when:
  - "View {COURSE} Resources" is clicked (direct, all exact matches combined)
  - "Preview" button clicked from course list (single course)
- Includes back button if coming from course list
- Sticky header with resource count and "Add All Resources" button
- Individual resource cards with "Add" buttons
- No nested dialogs

### 4. Improved Resource View
**Enhancements:**
- Sticky header with summary stats and bulk "Add All Resources" button
- Larger resource cards with better spacing
- Clearer material type badges (Electronic/Physical + specific type)
- Truncated URLs with hover states
- "From: [Term]" notes show which course version each resource came from
- Better visual hierarchy (larger title, smaller metadata)

**Layout:**
```tsx
<div className="space-y-3 pb-4">
  {/* Sticky header with stats */}
  <div className="bg-blue-50 sticky top-0 z-10">
    <p>{previewResources.length} total resources</p>
    <Button>Add All Resources</Button>
  </div>
  
  {/* Resource cards */}
  {previewResources.map(resource => (
    <Card className="p-4 hover:shadow-md">
      {/* Resource content */}
      <Button>Add</Button>
    </Card>
  ))}
</div>
```

### 5. Button Label Improvements
**Old:**
- "View GOV 201 History" (implied showing course list)
- "Add Materials" / "Copy Materials" (ambiguous)

**New:**
- "View GOV 201 Resources" (clear it shows resources directly)
- "Add All" / "Copy All" (from course cards)
- "Add All Resources" (from resource view header)
- "Add" (individual resource buttons)

## State Management Changes

### New States
```typescript
const [dialogView, setDialogView] = useState<'courses' | 'resources'>('courses');
```

### Removed States
```typescript
// No longer needed - unified into single dialog
const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
```

### Updated Functions

**handleOpenCloneDialog(mode, directToResources)**
```typescript
const handleOpenCloneDialog = async (
  mode: 'exact' | 'all' = 'exact',
  directToResources: boolean = false
) => {
  setViewMode(mode);
  setCloneDialogOpen(true);
  setLoadingPreviousCourses(true);
  
  // Set the view based on directToResources flag
  if (directToResources && mode === 'exact') {
    setDialogView('resources');
  } else {
    setDialogView('courses');
  }
  
  // Fetch courses...
  // If directToResources, automatically load combined resources
  if (directToResources && mode === 'exact') {
    const exactMatches = validCourses.filter(c => c.isExactMatch);
    if (exactMatches.length > 0) {
      await loadResourcesFromMultipleCourses(exactMatches);
    }
  }
};
```

**loadResourcesFromMultipleCourses(courses)** (new)
```typescript
// Fetches resources from multiple courses and combines them
// Sets previewCourse to a synthetic course representing all versions
// Tags each resource with "From: [Term]" to show origin
// Sets dialogView to 'resources'
```

**handlePreviewCourse(course)**
```typescript
// Now just sets dialogView to 'resources' (no separate dialog)
setDialogView('resources');
```

## User Experience Comparison

### Before
1. Click "View GOV 201 History"
2. See list of 3 GOV 201 courses
3. Click "Preview" on Fall 2024 course
4. **New smaller dialog opens on top**
5. See Fall 2024 resources
6. Add some, close preview dialog
7. Click "Preview" on Spring 2024
8. **Another dialog opens**
9. Repeat...

**Issues:**
- Multiple dialog layers confusing
- Small dialogs require lots of scrolling
- Repetitive preview → close → preview workflow
- Can't see which term resources came from when combined

### After
1. Click "View GOV 201 Resources"
2. **Immediately see ALL resources from Fall 2024 + Spring 2024 + Fall 2023**
3. Each resource tagged "From: Fall 2024" etc.
4. Browse full list in one large modal
5. Click "Add" on individual favorites OR "Add All Resources" for everything
6. Click "Back to courses" if want to see course list
7. Or click "Browse All My Courses" to see other departments

**Benefits:**
- One large modal, no nesting
- All resources visible at once
- Clear origin tags ("From: Fall 2024")
- Sticky header with quick "Add All" button
- More space for content
- Fewer clicks to access resources

## Example Scenario

**Dr. Smith teaching GOV 201 Spring 2025**

### Old Flow (7 clicks)
1. Click "View GOV 201 History"  
   → See 3 courses
2. Click "Preview" (Fall 2024)  
   → Dialog opens with 15 resources
3. Click "Add" on 5 resources
4. Click "Close"  
   → Back to course list
5. Click "Preview" (Spring 2024)  
   → Another dialog with 10 resources
6. Click "Add" on 3 resources
7. Click "Close"

### New Flow (2 clicks minimum)
1. Click "View GOV 201 Resources"  
   → **See ALL 25 resources from 3 terms immediately**
2. Click "Add All Resources"  
   → Done! All 25 added

**OR, for selective adding:**
1. Click "View GOV 201 Resources"
2. Scroll through full combined list
3. Click "Add" on 8 favorite resources from various terms
4. Click "Close"

## Technical Details

### Dialog Structure
```tsx
<Dialog open={cloneDialogOpen} className="max-w-6xl max-h-[90vh]">
  <DialogHeader>
    <DialogTitle>
      {dialogView === 'resources' ? 'Resources' : 'Copy Materials'}
    </DialogTitle>
    <DialogDescription>
      {dialogView === 'resources' && previewCourse ? (
        <>
          <Button onClick={() => setDialogView('courses')}>
            ← Back to courses
          </Button>
          <Badge>{previewCourse.term}</Badge>
        </>
      ) : (
        'Select a course...'
      )}
    </DialogDescription>
  </DialogHeader>
  
  <ScrollArea className="flex-1">
    {dialogView === 'resources' ? (
      /* Resource cards with sticky header */
    ) : (
      /* Course list with preview buttons */
    )}
  </ScrollArea>
</Dialog>
```

### API Calls Optimization
When loading multiple courses' resources:
- Parallel fetches using `for...of` loop (sequential but controlled)
- Combines physical + electronic for each course
- Error handling per-course (one failure doesn't block others)
- Progress shown with loading spinner
- Result: Combined array with origin tags

### Resource Origin Tracking
```typescript
allResources.push({
  type: 'electronic',
  title: resource.title,
  author: resource.authors,
  notes: `From: ${course.term}`, // Added term tag
  _originalResource: resource // For cloning
});
```

## Files Modified

- `src/pages/SubmissionEditor.tsx`
  - Updated `handleOpenCloneDialog` signature to accept `directToResources` param
  - Added `loadResourcesFromMultipleCourses` function (125 lines)
  - Added `dialogView` state for view switching
  - Removed separate preview dialog
  - Unified into single large modal with conditional rendering
  - Changed all department filters to `SC*`
  - Updated button labels for clarity

## Future Enhancements

1. **Resource Grouping** - Group resources by term in combined view
2. **Smart Filtering** - Filter combined resources by type, term, author
3. **Deduplication** - Detect and highlight duplicate resources across terms
4. **Batch Selection** - Checkboxes to select multiple resources before adding
5. **Term Comparison** - Side-by-side view of two course versions
6. **Course Notes** - Show instructor notes from previous terms with resources

## Testing Checklist

- [x] Build succeeds without errors
- [ ] "View {COURSE} Resources" button shows combined resources immediately
- [ ] Back button works from resource view to course list
- [ ] "Browse All My Courses" still shows course list view
- [ ] Preview button from course list shows single course resources
- [ ] Modal is larger (6xl width, 90vh height)
- [ ] Sticky header with "Add All Resources" button visible while scrolling
- [ ] Resource cards show "From: [Term]" tags correctly
- [ ] Individual "Add" buttons work for each resource
- [ ] Bulk "Add All Resources" adds everything at once
- [ ] No dialog stacking (only one modal ever open)
- [ ] All API calls use `SC*` department filter
