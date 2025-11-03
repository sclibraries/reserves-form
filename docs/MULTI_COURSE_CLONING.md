# Multi-Course Cloning Feature

## Overview
Faculty can now copy materials from multiple previous courses into a single new course, allowing them to build a comprehensive reading list by cherry-picking from different sources.

## The Problem We Solved

### Original Issue
After cloning from one course, the clone banner disappeared, preventing faculty from:
- Adding materials from multiple previous terms
- Combining materials from related courses
- Building a composite reading list from various sources

### Edge Case Scenario
```
Faculty teaching GOV 234 (Spring 2026) wants to:
1. Copy 10 articles from GOV 234 (Fall 2025)
2. Add 5 books from GOV 234 (Spring 2025)  
3. Include 3 videos from GOV 301 (related course)
4. Pick 2 chapters from GOV 101 (foundational material)

Total: 20 materials from 4 different courses
```

## Solution: Persistent Clone Banner

### Key Changes

#### 1. Banner Stays Visible After Cloning
```typescript
// ❌ BEFORE - Banner disappeared after first clone
setCloneDialogOpen(false);
setShowCloneSuggestion(false); // Hid the banner

// ✅ AFTER - Banner stays for multi-course cloning
setCloneDialogOpen(false);
// Don't hide banner - user can clone from more courses
```

#### 2. Banner Shows Current Progress
The banner now displays how many materials have been added:

**When Empty:**
```
🎯 Copy Materials from Previous Terms
We found previous versions of GOV 234 that you taught.
Copy materials from one or more terms to build your list.

[Browse Previous Versions] [Start Fresh Instead]
```

**After Cloning (10 materials):**
```
🎯 Copy Materials from Previous Terms
You have 10 materials so far. You can continue adding 
from previous versions of this course.

[Browse Previous Versions] [Dismiss]
```

#### 3. Dialog Shows Current Count
Dialog title updates to show progress:

**First Time:**
```
Copy Materials from Previous Courses
Select a course to copy materials from.
```

**Subsequent Times:**
```
Add More Materials (10 current)
Select additional courses to copy materials from. 
Materials will be added to your current 10 items.
```

#### 4. Buttons Reflect Context

**Banner Button:**
- Empty: "Browse Previous Versions"
- Has Materials: "Browse Previous Versions" (same - can add more)

**Dismiss Button:**
- Empty: "Start Fresh Instead"
- Has Materials: "Dismiss" (they're building, not starting fresh)

**Course Cards:**
- Empty: "Copy Materials"
- Has Materials: "Add Materials"

## User Flow Examples

### Example 1: Single Course Clone (Traditional)
```
1. Open empty GOV 234 (Spring 2026)
2. Banner: "Copy Materials from Previous Terms"
3. Click: "Browse Previous Versions"
4. See: GOV 234 Fall 2025 (19 materials)
5. Click: "Copy Materials"
6. Success: "Cloned 19 materials successfully!"
7. Banner: Still visible, now shows "You have 19 materials"
8. Click: "Dismiss" to hide banner
9. Continue: Edit the 19 materials
```

### Example 2: Multi-Course Clone (New Feature!)
```
1. Open empty GOV 234 (Spring 2026)
2. Banner: "Copy Materials from Previous Terms"
3. Click: "Browse Previous Versions"
4. See: GOV 234 Fall 2025 (19 materials)
5. Click: "Copy Materials" → 19 added
6. Dialog closes, banner shows "You have 19 materials"
7. Click: "Browse Previous Versions" again
8. Dialog: "Add More Materials (19 current)"
9. See: GOV 234 Spring 2025 (15 materials)
10. Click: "Add Materials" → 15 more added (total: 34)
11. Click: "Browse Previous Versions" again
12. Dialog: "Add More Materials (34 current)"
13. Switch to: "Other Courses" section
14. See: GOV 301 Advanced Topics (12 materials)
15. Click: "Add Materials" → 12 more added (total: 46)
16. Click: "Dismiss" on banner
17. Continue: Edit/organize 46 materials
```

### Example 3: Selective Cloning Strategy
```
Faculty's Mental Model:
"I want the foundation from 101, the advanced theory from 301,
and recent case studies from last term's 234"

Workflow:
1. Clone from GOV 234 Fall 2025 → Get recent materials
2. Delete 5 outdated items → Down to 14
3. Clone from GOV 301 Spring 2025 → Add 8 advanced materials (total: 22)
4. Delete 3 duplicates → Down to 19
5. Clone from GOV 101 Fall 2024 → Add 4 foundational materials (total: 23)
6. Reorder and organize into folders
7. Submit to library
```

## UI Components

### Clone Banner States

#### State 1: Empty Course
```tsx
<Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
  <h3>Copy Materials from Previous Terms</h3>
  <p>We found previous versions of GOV 234 that you taught.</p>
  <Button>Browse Previous Versions</Button>
  <Button variant="outline">Start Fresh Instead</Button>
  <p className="text-xs">💡 You can copy from multiple courses!</p>
</Card>
```

#### State 2: Has Materials (Building)
```tsx
<Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
  <h3>Copy Materials from Previous Terms</h3>
  <p>You have <strong>15 materials</strong> so far. Continue adding...</p>
  <Button>Browse Previous Versions</Button>
  <Button variant="outline">Dismiss</Button>
  <p className="text-xs">💡 You can copy from multiple courses!</p>
</Card>
```

#### State 3: Dismissed
```tsx
{/* Banner hidden - user clicked Dismiss */}
```

### Dialog States

#### State 1: First Clone (0 materials)
```tsx
<DialogTitle>Copy Materials from Previous Courses</DialogTitle>
<DialogDescription>
  Select a course to copy materials from.
</DialogDescription>
<Button>Copy Materials</Button>
```

#### State 2: Adding More (15 materials)
```tsx
<DialogTitle>Add More Materials (15 current)</DialogTitle>
<DialogDescription>
  Select additional courses to copy materials from. 
  Materials will be added to your current 15 items.
</DialogDescription>
<Button>Add Materials</Button>
```

## Benefits

### 1. Flexibility 🎯
- Copy from multiple sources
- Build composite reading lists
- Mix exact matches with related courses

### 2. Transparency 📊
- Always see current material count
- Clear when adding vs. replacing
- Know progress at each step

### 3. Control 🎮
- Dismiss banner when done
- Banner stays if you want more
- Manual control over workflow

### 4. Efficiency ⚡
- No need to navigate away
- Continuous workflow
- Add, review, add more, review

## Technical Implementation

### State Management
```typescript
// Banner visibility is independent of cloning success
const [showCloneSuggestion, setShowCloneSuggestion] = useState(false);

// User must explicitly dismiss banner
const handleDismiss = () => {
  setShowCloneSuggestion(false);
};

// Cloning does NOT auto-dismiss banner
const handleClone = async () => {
  // ... clone logic ...
  setCloneDialogOpen(false); // Close dialog
  // setShowCloneSuggestion(false); // ❌ DON'T hide banner
};
```

### Dynamic Content
```typescript
// Banner message adapts to context
{reserve.items.length > 0 ? (
  <>You have <strong>{reserve.items.length} materials</strong> so far.</>
) : (
  <>We found previous versions of {reserve.courseCode}.</>
)}

// Button text changes based on state
{reserve.items.length > 0 ? 'Add Materials' : 'Copy Materials'}

// Dialog title shows progress
{reserve.items.length > 0 
  ? `Add More Materials (${reserve.items.length} current)` 
  : 'Copy Materials from Previous Courses'}
```

## User Testing Insights

### Scenario A: Traditional User (Single Clone)
```
User: "I just want to copy from last term"
Flow: 
  1. Click "Browse" 
  2. Select Fall 2025
  3. Click "Copy"
  4. Click "Dismiss"
  5. Done
Result: ✅ Banner gone after 1 clone (user choice)
```

### Scenario B: Power User (Multi-Clone)
```
User: "I want materials from 3 different courses"
Flow:
  1. Click "Browse"
  2. Copy from GOV 234 Fall 2025
  3. Banner shows "15 materials"
  4. Click "Browse" again
  5. Copy from GOV 234 Spring 2025
  6. Banner shows "28 materials"
  7. Click "Browse" again
  8. Copy from GOV 301
  9. Banner shows "40 materials"
  10. Click "Dismiss"
  11. Done
Result: ✅ 40 materials from 3 sources
```

### Scenario C: Selective User (Clone + Edit + Clone)
```
User: "Clone, review, maybe add more"
Flow:
  1. Copy from Fall 2025 (15 items)
  2. Review materials
  3. Delete 5 outdated ones (10 left)
  4. Banner still shows "10 materials"
  5. Decide to add more
  6. Click "Browse"
  7. Copy from Spring 2025 (8 more)
  8. Total: 18 materials
  9. Done - Click "Dismiss"
Result: ✅ Flexible workflow supported
```

## Edge Cases Handled

### 1. Clone from Same Course Twice
```
Behavior: Allowed (creates duplicates)
Reason: User might want multiple copies for different sections
Solution: User can delete duplicates manually
```

### 2. Banner with Many Materials
```
Behavior: Banner stays visible even at 50+ materials
Reason: User might still want to add more
Solution: User explicitly dismisses when done
```

### 3. Empty Clone (0 materials)
```
Behavior: Shows "No materials found"
Banner: Stays visible (user can try another course)
Dialog: Closes automatically
```

### 4. Rapid Multi-Clone
```
Behavior: Prevent button spam with disabled state
Loading: Show "Copying..." on active clone
Queue: Only one clone operation at a time
```

## Future Enhancements

### 1. Preview Before Adding
```tsx
<Dialog>
  <h3>Preview: GOV 234 Fall 2025 (15 materials)</h3>
  <Checkbox>[ ] Article 1</Checkbox>
  <Checkbox>[ ] Book 2</Checkbox>
  <Button>Add Selected (12 of 15)</Button>
</Dialog>
```

### 2. Duplicate Detection
```tsx
<Alert>
  Warning: 3 materials already exist in your course.
  <Button>Add Anyway</Button>
  <Button>Skip Duplicates</Button>
</Alert>
```

### 3. Smart Suggestions
```tsx
<Banner>
  💡 You have 10 articles but no books. 
  GOV 234 Fall 2025 has 5 books you might want.
  <Button>View Books</Button>
</Banner>
```

### 4. Cloning History
```tsx
<Card>
  <h4>Recently Added From:</h4>
  <ul>
    <li>GOV 234 Fall 2025 - 15 items</li>
    <li>GOV 301 Spring 2025 - 8 items</li>
  </ul>
  <Button>Undo Last Addition</Button>
</Card>
```

## Summary

✅ **Multi-Course Support:** Clone from unlimited sources
✅ **Progress Tracking:** Always see current material count
✅ **Flexible Workflow:** Add, review, add more, review
✅ **Clear Intent:** "Add" vs "Copy" language
✅ **User Control:** Dismiss when ready
✅ **Edge Cases:** Handles all scenarios gracefully

Faculty can now build comprehensive reading lists by combining materials from multiple previous courses! 🎉
