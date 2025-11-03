# Smart Clone Detection System

## Overview
The system now intelligently detects if previous versions of the course exist BEFORE showing the clone banner, providing accurate messaging to faculty.

## How It Works

### 1. Page Load Detection (useEffect)
When the SubmissionEditor page loads with an empty course:

```typescript
useEffect(() => {
  // Only run for empty courses
  if (reserve.items.length > 0 || reserve.folders.length > 0) return;
  
  // Extract course info: "GOV 234" -> dept="GOV", number="234"
  const match = reserve.courseCode.match(/^([A-Z]+)\s*(\d+[A-Z]?)/);
  
  // Query: exact course number + department + instructor
  const query = `(courseNumber=="${reserve.courseCode}" and department.name=="SC ${department}*" and courseListing.instructorObjects="${user.full_name}*")`;
  
  // Fetch from API
  const courses = await fetch(searchUrl);
  
  // Update state based on results
  if (courses.length > 0) {
    setHasExactMatchCourses(true); // Found previous versions!
  } else {
    setHasExactMatchCourses(false); // No exact matches
  }
  
  setShowCloneSuggestion(true); // Show banner either way
}, [reserve, user]);
```

### 2. Dynamic Banner Messages

The banner now shows different content based on detection results:

#### Scenario A: Exact Matches Found ✅
```
🎯 Copy Materials from a Previous Term?

We found previous versions of GOV 234 that you taught. 
Would you like to copy materials to save time?

[View Previous Versions] [Start Fresh Instead]
```

#### Scenario B: No Exact Matches ℹ️
```
🔍 Search Your Previous Courses?

We didn't find previous versions of GOV 234, but you can 
search all your courses to copy relevant materials.

[Search All My Courses] [Start Fresh Instead]
```

### 3. Smart Search Query

When user clicks the button, the search adjusts based on what we found:

#### If Exact Matches Exist:
```typescript
// Show only exact matches (GOV 234), sorted by term (newest first)
const query = `(
  courseNumber=="${reserve.courseCode}" 
  and department.name=="SC ${department}*" 
  and courseListing.instructorObjects="${user.full_name}*"
) sortby courseListing.termObject.name/sort.descending`;
```

**Result:** Shows only previous versions of GOV 234 in reverse chronological order
- GOV 234 - Fall 2025
- GOV 234 - Spring 2025
- GOV 234 - Fall 2024

#### If No Exact Matches:
```typescript
// Show all courses in this department by this instructor
const query = `(
  department.name=="SC ${department}*" 
  and courseListing.instructorObjects="${user.full_name}*"
) sortby name`;
```

**Result:** Shows all Government courses by instructor
- GOV 101 - Intro to Government
- GOV 201 - Constitutional Law
- GOV 301 - Advanced Topics

## API Queries

### Initial Detection Query
```
URL: https://libtools2.smith.edu/folio/web/search/search-courses
Method: GET
Query: (courseNumber=="GOV 234" and department.name=="SC GOV*" and courseListing.instructorObjects="Joseph Cozza*") sortby courseListing.termObject.name/sort.descending

Purpose: Check if exact course matches exist
Triggered: On page load (empty course only)
Updates: hasExactMatchCourses state
```

### Dialog Search Query (Exact Matches)
```
URL: https://libtools2.smith.edu/folio/web/search/search-courses
Method: GET
Query: (courseNumber=="GOV 234" and department.name=="SC GOV*" and courseListing.instructorObjects="Joseph Cozza*") sortby courseListing.termObject.name/sort.descending

Purpose: Fetch exact course matches for cloning
Triggered: When user clicks "View Previous Versions"
Returns: Only GOV 234 courses, newest first
```

### Dialog Search Query (All Courses)
```
URL: https://libtools2.smith.edu/folio/web/search/search-courses
Method: GET
Query: (department.name=="SC GOV*" and courseListing.instructorObjects="Joseph Cozza*") sortby name

Purpose: Fetch all department courses for cloning
Triggered: When user clicks "Search All My Courses"
Returns: All GOV courses by instructor, alphabetical
```

## State Management

### New State Variables
```typescript
const [hasExactMatchCourses, setHasExactMatchCourses] = useState(false);
// true = found previous versions of this course
// false = no exact matches found

const [checkingForPreviousCourses, setCheckingForPreviousCourses] = useState(false);
// true = API call in progress (on page load)
// false = detection complete
```

### Banner Display Logic
```typescript
{showCloneSuggestion && reserve.items.length === 0 && !checkingForPreviousCourses && (
  <Banner>
    {hasExactMatchCourses ? (
      <ExactMatchMessage />
    ) : (
      <NoMatchMessage />
    )}
  </Banner>
)}
```

## User Flow Examples

### Example 1: Faculty Teaching GOV 234 for 3rd Time
```
1. Page loads with empty GOV 234 (Spring 2026)
2. useEffect runs detection query
3. Finds: GOV 234 Fall 2025, GOV 234 Spring 2025
4. Sets: hasExactMatchCourses = true
5. Shows: "We found previous versions of GOV 234"
6. Button: "View Previous Versions"
7. User clicks button
8. Dialog shows: Only GOV 234 courses (Fall 2025, Spring 2025)
9. User copies from Fall 2025
10. Materials appear in current course
```

### Example 2: Faculty Teaching GOV 234 for 1st Time
```
1. Page loads with empty GOV 234 (Spring 2026)
2. useEffect runs detection query
3. Finds: Nothing (no previous GOV 234)
4. Sets: hasExactMatchCourses = false
5. Shows: "We didn't find previous versions of GOV 234"
6. Button: "Search All My Courses"
7. User clicks button
8. Dialog shows: All GOV courses (GOV 101, GOV 201, GOV 301, etc.)
9. User copies from GOV 301 (similar content)
10. Materials appear in current course
```

### Example 3: Faculty Reopening Course with Materials
```
1. Page loads with GOV 234 that has 15 materials
2. useEffect checks: reserve.items.length > 0
3. Early return: No detection query runs
4. Banner: Does not appear
5. Faculty: Continues editing existing materials
```

## Benefits

### 1. Honest Messaging ✅
- No false promises about finding previous courses
- Accurate communication based on actual API data
- Users know what to expect before clicking

### 2. Targeted Results 🎯
- Exact matches get exactly what they want (same course, previous terms)
- No matches get broader search (all courses in department)
- Appropriate sorting for each scenario

### 3. Performance Optimization ⚡
- Detection query only runs once on page load
- Only runs for empty courses (not for courses with materials)
- Results cached in state for dialog display

### 4. Better UX 😊
- Clear call-to-action based on context
- "View Previous Versions" vs "Search All My Courses"
- Users understand their options

## Query Structure Breakdown

### Course Number Search
```
courseNumber=="GOV 234"
```
- Matches exact course code
- Case-sensitive
- Must include space between letters and numbers

### Department Filter
```
department.name=="SC GOV*"
```
- "SC" prefix for Smith College departments
- "GOV" for Government department
- Wildcard (*) for variations

### Instructor Filter
```
courseListing.instructorObjects="Joseph Cozza*"
```
- Matches instructor name
- Wildcard allows for middle names, suffixes
- Searches in instructorObjects array

### Sort Options
```
sortby courseListing.termObject.name/sort.descending
```
- Descending: Newest terms first (Fall 2025, Spring 2025, Fall 2024)
- Useful for exact matches (want most recent version)

```
sortby name
```
- Alphabetical by course name
- Useful for browsing all courses in department

## Error Handling

### API Fails to Load
```typescript
try {
  const courses = await fetch(searchUrl);
  setHasExactMatchCourses(courses.length > 0);
} catch (error) {
  console.error('Failed to check for previous courses:', error);
  // Still show banner, but without specific knowledge
  setShowCloneSuggestion(true);
}
```

### Invalid Course Code Format
```typescript
const match = reserve.courseCode.match(/^([A-Z]+)\s*(\d+[A-Z]?)/);
if (!match) {
  // Course code doesn't match expected format
  setCheckingForPreviousCourses(false);
  return; // Skip detection, don't show banner
}
```

### Empty Response
```typescript
const courses = coursesData.data?.courses || [];
if (courses.length > 0) {
  setHasExactMatchCourses(true);
} else {
  setHasExactMatchCourses(false); // Show "search all" option
}
```

## Testing Scenarios

### Test 1: Exact Match Exists
```
Setup: GOV 234 exists in Fall 2025 with materials
Action: Open empty GOV 234 Spring 2026
Expected:
  ✓ Detection query runs on load
  ✓ Finds Fall 2025 course
  ✓ Banner: "We found previous versions"
  ✓ Button: "View Previous Versions"
  ✓ Dialog shows only GOV 234 courses
```

### Test 2: No Exact Match
```
Setup: No previous GOV 234, but GOV 101 exists
Action: Open empty GOV 234 Spring 2026
Expected:
  ✓ Detection query runs on load
  ✓ Finds no GOV 234
  ✓ Banner: "We didn't find previous versions"
  ✓ Button: "Search All My Courses"
  ✓ Dialog shows all GOV courses (including GOV 101)
```

### Test 3: Course Has Materials
```
Setup: GOV 234 with 10 materials
Action: Open GOV 234
Expected:
  ✗ Detection query does NOT run
  ✗ Banner does NOT appear
  ✓ User can edit existing materials
```

### Test 4: API Failure
```
Setup: Network error or API down
Action: Open empty GOV 234
Expected:
  ✓ Detection query runs
  ✓ Error caught gracefully
  ✓ Banner still appears (fallback)
  ✓ Dialog shows all courses (safe default)
```

## Performance Considerations

### Detection Query
- **When:** Once on page load
- **Duration:** ~200-500ms (network dependent)
- **Blocking:** No (runs async in useEffect)
- **Caching:** Results stored in hasExactMatchCourses state

### Dialog Query
- **When:** User clicks button
- **Duration:** ~500-1000ms (fetches resource counts too)
- **Blocking:** Yes (shows loading spinner)
- **Caching:** Results stored in previousCourses state

### Resource Counting
- **When:** After fetching course list
- **Duration:** ~100-300ms per course
- **Parallel:** Yes (Promise.all for all courses)
- **Impact:** Electronic resources only (physical has CORS)

## Future Enhancements

### 1. Cache Detection Results
- Store in localStorage or session storage
- Avoid re-querying on page refresh
- Invalidate when course gains materials

### 2. Show Detection Status
- Loading indicator while checking
- "Checking for previous versions..." message
- Fade in banner after detection complete

### 3. Prefetch Resource Counts
- During initial detection, fetch counts too
- Store in state for instant dialog display
- Reduces perceived load time

### 4. Smart Suggestions
- If no exact match, suggest closest match
- "No GOV 234, but GOV 233 is similar"
- Use fuzzy matching or department rules

### 5. Remember User Preference
- If user clicks "Start Fresh" multiple times
- Remember choice per course
- Don't show banner again for that course

## Summary

The system now:
✅ Verifies data before making claims
✅ Provides accurate, context-aware messaging
✅ Adjusts search strategy based on findings
✅ Optimizes user experience with targeted results
✅ Handles errors gracefully
✅ Only runs when necessary (empty courses)

Faculty get honest, helpful information about their cloning options!
