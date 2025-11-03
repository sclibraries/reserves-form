# Duplicate Course Information Enhancement

## Problem
When faculty clicked "Duplicate Previous Course", the system would:
- Silently fetch the most recent previous course
- Not inform the user which course was being duplicated
- Leave faculty uncertain about what materials they were reusing

This created confusion and uncertainty about the duplicate operation.

## Solution
Enhanced the "Duplicate Previous Course" flow to:
1. **Fetch course information first** before showing the dialog
2. **Display source course details** prominently in the dialog
3. **Show resource counts** so faculty know what they're duplicating
4. **Handle edge cases** when no previous course exists

## Technical Implementation

### State Management
Added new state variables:
```typescript
const [duplicateSourceCourse, setDuplicateSourceCourse] = React.useState<{
  term: string;
  courseName: string;
  resourceCount: number;
} | null>(null);
const [loadingDuplicateSource, setLoadingDuplicateSource] = React.useState(false);
```

### Pre-fetch Handler
Created `handleOpenDuplicateDialog()` that:
- Fetches previous courses before opening dialog
- Extracts the most recent (first) course
- Stores course details in state
- Shows loading state on button
- Opens dialog after data is ready

### Button Enhancement
Updated button to:
- Call `handleOpenDuplicateDialog` instead of directly opening dialog
- Show "Loading..." text while fetching
- Disable button during fetch to prevent duplicate clicks

### Dialog Enhancement
Updated dialog to display:

**When previous course found:**
```
┌─────────────────────────────────────┐
│ Duplicating from:                   │
│ BIO 202 · Fall 2025                 │
│ 15 electronic resources + any       │
│ physical books                      │
└─────────────────────────────────────┘
```

**When no previous course found:**
```
┌─────────────────────────────────────┐
│ ⚠️ No previous version of BIO 202   │
│ found. Library staff will be        │
│ notified you want to reuse          │
│ materials.                          │
└─────────────────────────────────────┘
```

## User Experience Flow

### Before Enhancement
```
1. Click "Duplicate Previous Course"
2. Dialog opens immediately
3. Click "Submit as Duplicate"
4. System fetches previous course
5. ❓ User doesn't know what was duplicated
```

### After Enhancement
```
1. Click "Duplicate Previous Course"
2. Button shows "Loading..."
3. System fetches most recent previous course
4. Dialog opens with course information displayed
5. Faculty sees: "BIO 202 · Fall 2025 (15 resources)"
6. Click "Submit as Duplicate"
7. ✅ User knows exactly what they're duplicating
```

## Visual Design

### Information Card (Blue)
Used when previous course is found:
- **Background:** Blue-50 with blue-200 border
- **Title:** "Duplicating from:" in blue-900
- **Course:** Bold course code, term in blue-700
- **Resources:** Small text showing count in blue-600

### Warning Card (Yellow)
Used when no previous course exists:
- **Background:** Yellow-50 with yellow-200 border
- **Icon:** Alert circle
- **Message:** Explains no previous course found in yellow-800

## Benefits

1. **Transparency**: Faculty knows exactly which course is being duplicated
2. **Confidence**: Shows resource counts before submission
3. **Error Prevention**: Clear warning when no previous course exists
4. **Better UX**: Information is shown upfront, not after the fact
5. **Informed Decisions**: Faculty can cancel if wrong course would be duplicated

## Edge Cases Handled

✅ **No previous course exists**: Shows warning message, allows submission with note to staff  
✅ **API failure**: Gracefully falls back to null state with warning  
✅ **Loading state**: Button disabled and shows "Loading..." during fetch  
✅ **Zero resources**: Shows "Physical books only" message  

## Future Enhancements

Potential improvements:
1. Allow faculty to **choose** which previous term to duplicate (not just most recent)
2. Show preview of actual materials before confirming
3. Add instructor name to confirm it's their previous course
4. Show date range of the previous course term
5. Add "View Details" link to see full course information

## Testing Checklist

- [x] Click "Duplicate Previous Course" button
- [x] Verify "Loading..." shows while fetching
- [x] Verify dialog shows course information when found
- [x] Test with course that has previous version
- [x] Test with course that has NO previous version
- [x] Verify resource counts display correctly
- [x] Test with 0 resources (physical only)
- [x] Verify canceling works correctly
- [x] Verify submitting still works as expected

## Related Files
- `/src/pages/SubmissionEditor.tsx` - Main editor with duplicate dialog
- `/src/hooks/useCourseCloning.ts` - Course fetching logic
- `/src/handlers/submissionHandlers.ts` - Submission logic
