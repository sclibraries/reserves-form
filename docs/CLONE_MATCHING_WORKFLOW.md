# Course Cloning & Matching Workflow

## Overview

This document describes the workflow for faculty to create course reserves, focusing on the integration between registrar-imported courses and the cloning functionality.

## Current State

### What Works Now
- ✅ Faculty can manually create new courses
- ✅ Faculty can browse and clone from previous courses
- ✅ Manual selection of which previous course to clone

### What's Missing
- ❌ No automatic course import from registrar
- ❌ No smart matching between next term courses and previous courses
- ❌ Manual entry required for all course details

## Proposed Workflow

### Phase 1: Faculty Login & Course Discovery
```
Faculty logs in → System shows courses for next term
```

**Sources for Next Term Courses:**
1. **Registrar Import** (Future): Automatic feed from course registration system
2. **Manual Creation** (Current): Faculty creates course via "Create New Course" button
3. **Previous Import** (Current): Existing courses in the system for next term

### Phase 2: Smart Matching
```
Next Term Course → Match Algorithm → Suggested Previous Course(s)
```

**Matching Algorithm** (implemented in `CloneMatchingTest.tsx`):

| Match Type | Score | Example |
|------------|-------|---------|
| Exact course code | 100 | `CSC 201` → `CSC 201` |
| Same dept + number | 95 | `CSC201` → `CSC 201` |
| Same department | 30 | `CSC 201` → `CSC 301` |
| No match | 0 | `CSC 201` → `ENG 102` |

**Match Points:**
- **Primary**: Course Code (Department + Number)
- **Secondary**: Course Title (similarity)
- **Tertiary**: Instructor name

### Phase 3: Clone & Customize
```
Faculty reviews matches → Selects previous course → Clones materials → Edits as needed
```

## Testing the Workflow

### Setup Test Data

1. **Create a "Previous Term" Course:**
   ```
   Dashboard → Create New Course
   - Course Code: CSC 201
   - Title: Data Structures
   - Term: Spring 2025 (or current term)
   - Add some materials (books, articles, etc.)
   ```

2. **Create a "Next Term" Course:**
   ```
   Dashboard → Create New Course
   - Course Code: CSC 201
   - Title: Data Structures
   - Term: Fall 2025 (or next term)
   - Leave empty (no materials)
   ```

3. **Test Matching:**
   ```
   Dashboard → "Open Test Interface" button
   - View automatic matches
   - See match scores
   - Test cloning functionality
   ```

### Test Cases

#### Test 1: Exact Match
```
Previous: CSC 201 (Spring 2025)
Next: CSC 201 (Fall 2025)
Expected: 100% match score, auto-selected
```

#### Test 2: Partial Match
```
Previous: CSC 201 (Spring 2025)
Next: CSC 301 (Fall 2025)
Expected: 30% match score (same dept)
```

#### Test 3: No Match
```
Previous: CSC 201 (Spring 2025)
Next: ENG 102 (Fall 2025)
Expected: No match shown (< 20% threshold)
```

#### Test 4: Multiple Matches
```
Previous 1: CSC 201 Section 01 (Fall 2024)
Previous 2: CSC 201 Section 02 (Spring 2025)
Next: CSC 201 (Fall 2025)
Expected: Both shown, most recent term ranked higher
```

## Implementation Details

### Key Files

1. **`CloneMatchingTest.tsx`** - Debug/test interface for matching algorithm
2. **`courseReservesStore.ts`** - `cloneReserve()` function
3. **`ClonePrevious.tsx`** - Current manual selection interface

### Matching Function

```typescript
const calculateMatchScore = (nextCode: string, prevCode: string) => {
  // Exact match
  if (nextCode === prevCode) {
    return { score: 100, reason: "Exact course code match" };
  }

  // Extract department and number (e.g., "CSC 201" -> ["CSC", "201"])
  const extractParts = (code: string) => {
    const match = code.match(/^([A-Z]+)\s*(\d+[A-Z]?)/i);
    if (match) {
      return { dept: match[1].toUpperCase(), number: match[2] };
    }
    return null;
  };

  const nextParts = extractParts(nextCode);
  const prevParts = extractParts(prevCode);

  // Same department and number
  if (nextParts.dept === prevParts.dept && nextParts.number === prevParts.number) {
    return { score: 95, reason: "Same department and course number" };
  }

  // Same department only
  if (nextParts.dept === prevParts.dept) {
    return { score: 30, reason: "Same department, different course number" };
  }

  return { score: 0, reason: "No match" };
};
```

### Clone Function

```typescript
cloneReserve(previousCourseId, {
  courseCode: nextCourse.courseCode,
  courseTitle: nextCourse.courseTitle,
  section: nextCourse.section,
  instructors: nextCourse.instructors,
  term: nextCourse.term,
})
```

This:
- Copies all items from previous course
- Updates course details to next term
- Preserves folders and organization
- Resets all item statuses to 'draft'

## Future Enhancements

### Priority 1: Enhanced Matching
- [ ] Consider instructor name in matching
- [ ] Use course title similarity (Levenshtein distance)
- [ ] Weight recent terms higher
- [ ] Allow manual match override

### Priority 2: Registrar Integration
- [ ] API endpoint to fetch faculty courses for next term
- [ ] Automatic import on login
- [ ] Sync with course registration system
- [ ] Handle cross-listed courses

### Priority 3: Bulk Operations
- [ ] "Clone All Matches" button
- [ ] Review multiple courses before cloning
- [ ] Batch editing of cloned materials
- [ ] Approval workflow

### Priority 4: Smart Suggestions
- [ ] ML-based matching (if enough data)
- [ ] Suggest materials based on course description
- [ ] Recommend removing outdated materials
- [ ] Flag materials that need copyright renewal

## Testing Checklist

- [ ] Create multiple previous term courses with materials
- [ ] Create matching next term courses (empty)
- [ ] Visit `/clone-matching-test` page
- [ ] Verify match scores are calculated correctly
- [ ] Test exact match (100 points)
- [ ] Test department match (30 points)
- [ ] Test no match (not shown)
- [ ] Clone materials from match
- [ ] Verify all items copied correctly
- [ ] Verify folders preserved
- [ ] Verify course details updated
- [ ] Edit cloned course
- [ ] Submit cloned course

## User Stories

### Story 1: Repeat Course
> "As a faculty member teaching CSC 201 again next semester, I want to automatically see my previous CSC 201 materials so I can quickly review and resubmit them."

**Implementation:**
1. Faculty logs in
2. System shows CSC 201 for next term (from registrar)
3. System suggests previous CSC 201 (100% match)
4. Faculty clicks "Clone & Edit"
5. Materials copied, ready for review

### Story 2: New Course Number
> "As a faculty member whose course changed from CSC 201 to CSC 202, I want to see the old course as a potential match so I can reuse relevant materials."

**Implementation:**
1. Faculty logs in
2. System shows CSC 202 for next term
3. System suggests CSC 201 (30% match - same dept)
4. Faculty reviews match, decides it's relevant
5. Faculty selects and clones

### Story 3: First Time Teacher
> "As a faculty member teaching a course for the first time, I want to see if other instructors have taught it so I can build on their materials."

**Implementation:**
1. Faculty logs in
2. System shows new course
3. System searches all previous reserves with same code
4. Shows materials from other instructors (with permission)
5. Faculty can clone with attribution

## API Endpoints (Future)

### Get Faculty Courses for Next Term
```
GET /api/registrar/faculty/{facultyId}/courses?term={termId}
```

Response:
```json
{
  "courses": [
    {
      "courseCode": "CSC 201",
      "courseTitle": "Data Structures",
      "section": "01",
      "term": "Fall 2025",
      "enrollmentCap": 25,
      "meetingTimes": "MWF 10:00-10:50"
    }
  ]
}
```

### Find Matching Previous Courses
```
GET /api/course-reserves/match?courseCode={code}&instructorId={id}
```

Response:
```json
{
  "matches": [
    {
      "reserveId": "reserve-123",
      "courseCode": "CSC 201",
      "term": "Spring 2025",
      "itemCount": 15,
      "matchScore": 100,
      "matchReason": "Exact course code match"
    }
  ]
}
```

## Questions for Discussion

1. **Matching Logic**: Should we weight instructor name heavily? Some faculty teach multiple sections.

2. **Cross-Listed Courses**: How do we handle courses listed under multiple departments (e.g., "PHIL 101 / REL 101")?

3. **Permissions**: Should faculty see materials from other instructors teaching the same course?

4. **Automatic Cloning**: Should we auto-clone 100% matches, or always require confirmation?

5. **Material Updates**: How do we flag materials that might be outdated (e.g., old editions, broken links)?

6. **Registrar Integration**: When should we sync with the registrar? On login? Daily? Real-time?
