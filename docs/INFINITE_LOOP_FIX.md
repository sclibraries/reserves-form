# Infinite Loop Fix

## Problem
The `useEffect` that checks for previous courses was running in an infinite loop, causing continuous API calls.

## Root Cause
The useEffect had `reserve` and `user` objects in its dependency array. These objects were being recreated on every render by Zustand stores, causing the effect to re-run continuously.

```typescript
// ❌ BEFORE - Caused infinite loop
useEffect(() => {
  checkForPreviousCourses();
}, [reserve, user]); // These objects change reference on every render!
```

## Solution
Used a `useRef` to track whether we've already checked for this course, preventing duplicate API calls:

```typescript
// ✅ AFTER - Runs only once per course
const hasCheckedForPreviousCourses = useRef(false);

// Reset flag when navigating to a different course
useEffect(() => {
  hasCheckedForPreviousCourses.current = false;
}, [id]);

useEffect(() => {
  const checkForPreviousCourses = async () => {
    // Prevent re-running if we've already checked
    if (hasCheckedForPreviousCourses.current) return;
    
    // Mark as checked immediately
    hasCheckedForPreviousCourses.current = true;
    
    // ... rest of the logic
  };
  
  checkForPreviousCourses();
}, [id, reserve?.courseCode, reserve?.items.length, reserve?.folders.length, user?.full_name, reserve, user]);
```

## How It Works

### 1. Initial Load
```
User opens GOV 234
→ hasCheckedForPreviousCourses.current = false
→ useEffect runs
→ Sets hasCheckedForPreviousCourses.current = true
→ Makes API call
→ Updates state
→ Component re-renders
→ useEffect sees hasCheckedForPreviousCourses.current = true
→ Returns early, no loop
```

### 2. Navigating to Different Course
```
User navigates to GOV 301
→ id changes
→ Reset useEffect runs: hasCheckedForPreviousCourses.current = false
→ Main useEffect runs
→ Sets hasCheckedForPreviousCourses.current = true
→ Makes API call for GOV 301
→ No loop
```

### 3. Re-renders (adding materials, etc.)
```
User adds a material
→ Component re-renders
→ useEffect sees hasCheckedForPreviousCourses.current = true
→ Returns early
→ No API call, no loop
```

## Why This Approach?

### Option 1: Specific Dependencies Only ❌
```typescript
}, [id, reserve?.courseCode, user?.full_name]);
```
**Problem:** ESLint complains about missing dependencies (reserve, user)
**Risk:** May miss important updates

### Option 2: Empty Dependency Array ❌
```typescript
}, []);
```
**Problem:** Only runs once on mount, not when navigating between courses
**Risk:** Stale data when switching courses

### Option 3: Ref Guard ✅ (Our Solution)
```typescript
const hasCheckedForPreviousCourses = useRef(false);

useEffect(() => {
  if (hasCheckedForPreviousCourses.current) return;
  hasCheckedForPreviousCourses.current = true;
  // ... logic
}, [id, reserve?.courseCode, reserve?.items.length, reserve?.folders.length, user?.full_name, reserve, user]);
```
**Benefits:**
- ✅ Satisfies ESLint (all dependencies included)
- ✅ Prevents infinite loop (ref guard)
- ✅ Resets per course (separate useEffect on id change)
- ✅ Safe from stale closures

## Additional Fix: Removed Duplicate useEffect

Also removed a redundant `useEffect` that was setting `showCloneSuggestion`:

```typescript
// ❌ REMOVED - Redundant and could cause issues
useEffect(() => {
  if (reserve.items.length === 0 && reserve.folders.length === 0) {
    setShowCloneSuggestion(true);
  }
}, [reserve, user]);
```

This was unnecessary because the main useEffect already sets `showCloneSuggestion` after checking for previous courses.

## Testing Checklist

### Test 1: Initial Load
```
[ ] Open empty course
[ ] Check network tab: Should see ONE request to search-courses
[ ] Verify no infinite loop
[ ] Verify banner appears
```

### Test 2: Re-render After Load
```
[ ] Open course
[ ] Wait for detection to complete
[ ] Add a material (triggers re-render)
[ ] Check network tab: Should see NO additional search-courses requests
```

### Test 3: Navigate Between Courses
```
[ ] Open GOV 234
[ ] Wait for detection (1 request)
[ ] Navigate to GOV 301
[ ] Wait for detection (1 new request for GOV 301)
[ ] Total: 2 requests (one per course)
```

### Test 4: Refresh Page
```
[ ] Open course
[ ] Wait for detection
[ ] Refresh page (F5)
[ ] Should run detection again (new page load)
[ ] Should see 1 new request
```

### Test 5: Course with Materials
```
[ ] Open course that already has materials
[ ] Check network tab: Should see NO search-courses requests
[ ] Early return prevents check for non-empty courses
```

## Performance Impact

### Before Fix (Infinite Loop):
- ∞ API requests per second
- Network tab fills with duplicate requests
- Browser slows down
- API rate limiting triggers
- Poor user experience

### After Fix:
- 1 API request on page load (for empty courses)
- 0 API requests for courses with materials
- 1 additional request when navigating to new course
- Fast, responsive UI
- Efficient API usage

## Code Structure

```typescript
const SubmissionEditor = () => {
  // State
  const [hasExactMatchCourses, setHasExactMatchCourses] = useState(false);
  const [checkingForPreviousCourses, setCheckingForPreviousCourses] = useState(false);
  
  // Ref to prevent infinite loop
  const hasCheckedForPreviousCourses = useRef(false);
  
  // Reset flag when course changes
  useEffect(() => {
    hasCheckedForPreviousCourses.current = false;
  }, [id]);
  
  // Check for previous courses (runs once per course)
  useEffect(() => {
    const checkForPreviousCourses = async () => {
      // Early returns
      if (!reserve || !user?.full_name) return;
      if (hasCheckedForPreviousCourses.current) return; // 🔑 Prevents loop
      if (reserve.items.length > 0 || reserve.folders.length > 0) return;
      
      // Mark as checked
      hasCheckedForPreviousCourses.current = true; // 🔑 Set immediately
      setCheckingForPreviousCourses(true);
      
      try {
        // API call
        const courses = await fetch(...);
        
        // Update state
        setHasExactMatchCourses(courses.length > 0);
        setShowCloneSuggestion(true);
      } catch (error) {
        console.error(error);
        setShowCloneSuggestion(true);
      } finally {
        setCheckingForPreviousCourses(false);
      }
    };
    
    checkForPreviousCourses();
  }, [id, reserve?.courseCode, reserve?.items.length, reserve?.folders.length, user?.full_name, reserve, user]);
  
  // ... rest of component
};
```

## Key Takeaways

1. **useRef for One-Time Operations:** When you need something to run once per mount/condition, use a ref guard
2. **Object Dependencies:** Be careful with objects in dependency arrays - they often have new references
3. **Early Returns:** Always return early if conditions aren't met to prevent unnecessary work
4. **Immediate Flag Setting:** Set the guard flag BEFORE async operations to prevent race conditions
5. **Reset on Navigation:** Reset flags when the context changes (like course ID)

## Summary

✅ **Fixed:** Infinite loop by using ref guard
✅ **Removed:** Duplicate useEffect
✅ **Preserved:** All functionality (detection still works)
✅ **Improved:** Performance (1 request vs ∞ requests)
✅ **Maintained:** Correctness (resets per course navigation)

The API now runs exactly once per empty course, as intended!
