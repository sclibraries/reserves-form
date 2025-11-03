# Resource Count Display Enhancement

## Issue
The "Copy Materials from Previous Courses" modal was only showing electronic resource counts and displaying "No resources found" when only physical resources existed. This was misleading since the Preview showed both electronic and physical counts.

## Solution
Enhanced the `PreviousCourse` interface and all related UI components to display separate electronic and physical resource counts.

## Changes Made

### 1. Updated PreviousCourse Interface
**File:** `src/hooks/useCourseCloning.ts`

Added separate count fields:
```typescript
export interface PreviousCourse {
  courseListingId: string;
  courseNumber: string;
  courseName: string;
  term: string;
  instructor: string;
  resourceCount: number;      // Total count (for sorting/filtering)
  electronicCount: number;    // NEW: Separate electronic count
  physicalCount: number;      // NEW: Separate physical count
  isExactMatch: boolean;
}
```

### 2. Updated fetchPreviousCourses()
**File:** `src/hooks/useCourseCloning.ts`

Now returns all three counts:
```typescript
return {
  courseListingId,
  courseNumber,
  courseName: course.name || 'Unknown Course',
  term: course.courseListingObject?.termObject?.name || 'Unknown Term',
  instructor: course.courseListingObject?.instructorObjects?.[0]?.name || instructorName,
  resourceCount: electronicCount + physicalCount, // Total
  electronicCount,  // Separate electronic count
  physicalCount,    // Separate physical count
  isExactMatch,
};
```

### 3. Updated CourseListView
**File:** `src/components/CloneDialog/CourseListView.tsx`

Now displays breakdown:
```typescript
{course.resourceCount > 0 ? (
  <span>
    <strong>{course.resourceCount}</strong> resource{course.resourceCount !== 1 ? 's' : ''} 
    <span className="text-xs text-muted-foreground ml-1">
      ({course.electronicCount} electronic, {course.physicalCount} physical)
    </span>
  </span>
) : (
  <>No resources found</>
)}
```

### 4. Updated TermSelectionView
**File:** `src/components/CloneDialog.tsx`

Shows detailed breakdown in term selection:
```typescript
<span>
  <span className="text-blue-600 font-medium">
    {course.resourceCount} resource{course.resourceCount !== 1 ? 's' : ''}
  </span>
  <span className="text-xs ml-1">
    ({course.electronicCount} electronic, {course.physicalCount} physical)
  </span>
</span>
```

### 5. Updated Duplicate Dialog
**File:** `src/pages/SubmissionEditor.tsx`

Enhanced duplicate source course state and display:
```typescript
// State
const [duplicateSourceCourse, setDuplicateSourceCourse] = React.useState<{
  term: string;
  courseName: string;
  resourceCount: number;
  electronicCount: number;
  physicalCount: number;
} | null>(null);

// Display
{duplicateSourceCourse.resourceCount > 0 
  ? `${duplicateSourceCourse.resourceCount} resources (${duplicateSourceCourse.electronicCount} electronic, ${duplicateSourceCourse.physicalCount} physical)`
  : 'No resources found'}
```

## Visual Changes

### Before:
```
Course Card:
┌─────────────────────────────────┐
│ BIO 202 - Cell Biology          │
│ Fall 2025 · John Smith          │
│ 📄 5 resources                  │ ❌ No breakdown
│ [Preview]                       │
└─────────────────────────────────┘
```

### After:
```
Course Card:
┌─────────────────────────────────┐
│ BIO 202 - Cell Biology          │
│ Fall 2025 · John Smith          │
│ 📄 15 resources                 │
│    (5 electronic, 10 physical)  │ ✅ Detailed breakdown
│ [Preview]                       │
└─────────────────────────────────┘
```

### Edge Cases:
```
Only Electronic:
📄 5 resources (5 electronic, 0 physical)

Only Physical:
📄 10 resources (0 electronic, 10 physical)

No Resources:
No resources found
```

## Benefits

1. **Transparency**: Faculty can see exactly what types of resources exist before previewing
2. **Accuracy**: No more misleading "No resources found" when physical items exist
3. **Consistency**: Same information displayed in course list and preview
4. **Informed Decisions**: Faculty know what they're getting before clicking preview
5. **Better UX**: Matches expectations - preview shows what was promised in the list

## Testing

- [x] Course with both electronic and physical shows: "15 resources (5 electronic, 10 physical)"
- [x] Course with only electronic shows: "5 resources (5 electronic, 0 physical)"
- [x] Course with only physical shows: "10 resources (0 electronic, 10 physical)"
- [x] Course with no resources shows: "No resources found"
- [x] Term selection screen shows same breakdown
- [x] Duplicate dialog shows same breakdown
- [x] All counts match what's shown in preview

## Related Files
- `/src/hooks/useCourseCloning.ts` - Interface and data fetching
- `/src/components/CloneDialog/CourseListView.tsx` - Course list display
- `/src/components/CloneDialog.tsx` - Term selection view
- `/src/pages/SubmissionEditor.tsx` - Duplicate dialog
