# Term Selection Fix for Course Cloning

## Problem
When clicking "View [CourseCode] Resources" in the clone dialog, the system was merging resources from ALL previous terms of the same course (e.g., Fall 2025, Fall 2024, Fall 2023). This created confusion because:
- Faculty couldn't tell which term's resources they were looking at
- Adding "all resources" would add materials from multiple terms
- No way to selectively choose resources from a specific term

## Solution
Implemented term selection functionality that:
1. Detects when multiple exact match courses exist across different terms
2. Shows a term selection screen where faculty can choose which term to load
3. Only loads resources from the selected term
4. Provides clear visual indication of which term's resources are displayed

## Technical Changes

### 1. CloneDialog Component (`src/components/CloneDialog.tsx`)

**Added State:**
- `dialogView`: Extended to include `'term-selection'` view type
- `availableTerms`: Array of `PreviousCourse[]` to store available terms

**New Component:**
- `TermSelectionView`: Displays a list of available terms with:
  - Term name badge with calendar icon
  - Resource count
  - Course details
  - "View Resources" button for each term

**Modified Logic:**
- Removed `loadResourcesFromMultipleCourses()` function that merged all resources
- Added `handleViewAllExactMatches()` that:
  - Checks if there are multiple exact match courses
  - Shows term selection if multiple terms exist
  - Directly loads resources if only one term exists
- Wrapped `handlePreviewCourse()` in `useCallback` for proper dependency management

### 2. User Flow

**Before:**
```
Click "View BIO 202 Resources"
  → Loads ALL resources from ALL terms (merged)
  → No way to distinguish which resources came from which term
```

**After:**
```
Click "View BIO 202 Resources"
  → If multiple terms exist:
    → Show term selection screen
    → Faculty selects specific term (e.g., "Fall 2025")
    → Load only resources from that term
  → If only one term exists:
    → Directly load resources from that term
```

## Visual Design

### Term Selection Screen
- Header: "Select Term for [CourseCode]"
- Description: "Multiple terms found for [CourseCode]. Select which term to load resources from:"
- Each term displayed as a card with:
  - Calendar icon + Term badge (e.g., "Fall 2025")
  - Resource count with file icon
  - Course details (course number and name)
  - "View Resources" button
- Back button: "← Back to all courses"

### Benefits
1. **Clarity**: Faculty knows exactly which term's resources they're viewing
2. **Control**: Can choose the most relevant term (usually most recent)
3. **Efficiency**: Avoids loading unnecessary resources from old terms
4. **Cleaner**: Resources aren't mixed together with "From: [Term]" notes

## Testing Checklist

- [ ] Create a course (e.g., BIO 202 for Winter 2026)
- [ ] Click "View BIO 202 Resources" in clone suggestion banner
- [ ] Verify term selection screen appears if multiple terms exist
- [ ] Select a specific term
- [ ] Verify only resources from that term are loaded
- [ ] Click "Back to all courses" and verify navigation works
- [ ] Test with a course that has only one previous term
- [ ] Verify it loads directly without term selection

## Future Enhancements

Potential improvements:
1. Show most recent term first in term selection
2. Add term date range to help faculty identify which semester
3. Allow comparing resources across terms side-by-side
4. Remember last selected term for faster workflow
5. Add "Load All Terms" option for advanced users who want to merge

## Related Files
- `/src/components/CloneDialog.tsx` - Main dialog component
- `/src/hooks/useCourseCloning.ts` - Course fetching logic
- `/src/components/CloneSuggestionBanner.tsx` - Banner that triggers clone dialog
- `/src/pages/SubmissionEditor.tsx` - Main editor page
