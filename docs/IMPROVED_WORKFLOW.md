# Improved Course Reserves Workflow

## Problem Identified

The original workflow was backwards:

### Old (Confusing) Flow
```
1. Dashboard → Create New Course (manual entry)
2. Fill out all course details
3. Go back to Dashboard → Clone Previous
4. Select course to clone
5. Creates ANOTHER new course (duplicate!)
6. Now you have two courses for the same thing
```

**Issues:**
- Faculty had to manually enter course details even though they came from registrar
- Cloning created a duplicate course instead of populating the current one
- No indication that materials could be copied when viewing an empty course
- Two separate workflows that didn't connect

## New (Intuitive) Flow

### Scenario 1: Faculty Member Returns to Teach Same Course

```
1. Faculty logs in
   ↓
2. Dashboard shows "GOV 234 - Comparative Politics (Spring 2026)" 
   [from registrar import - automatic]
   ↓
3. Faculty clicks "Open" on the course
   ↓
4. Editor page loads and detects:
   - Course is empty (0 materials)
   - Previous GOV 234 exists (Winter 2026, 19 materials)
   ↓
5. Banner appears: "Copy Materials from a Previous Term?"
   - Shows: "We found previous versions of GOV 234 with materials"
   - Two options:
     a) "Copy from Previous Term" → Copies all 19 materials
     b) "Start Fresh Instead" → Dismisses banner
   ↓
6. If copied: Materials appear, faculty can edit/remove/add more
   ↓
7. Faculty submits when ready
```

### Scenario 2: First Time Teaching (No Previous Course)

```
1. Faculty logs in
2. Dashboard shows new course from registrar
3. Faculty clicks "Open"
4. Editor page loads - no clone banner (no matches found)
5. Faculty manually adds materials
6. Faculty submits
```

### Scenario 3: Different Course Code but Related Content

```
1. Faculty logs in  
2. Dashboard shows "GOV 235" (new course)
3. Faculty clicks "Open"
4. No automatic match (different course code)
5. Faculty can still use "Copy from Previous Term" in header
6. Browse all their courses, manually select one
7. Materials copied, faculty edits
```

## Implementation Details

### Key Changes Made

#### 1. SubmissionEditor.tsx
- **Added clone detection**: Automatically finds matching courses when editor loads
- **Smart matching logic**: Matches by course code, excludes test data and current course
- **Inline banner**: Shows prominent suggestion when course is empty and matches exist
- **One-click cloning**: "Copy from Previous Term" button triggers cloning immediately
- **Preserves context**: Materials copy into CURRENT course, not create new one

#### 2. Matching Logic

```typescript
const potentialMatches = reserves.filter(r => {
  // Don't match with self
  if (r.id === reserve.id) return false;
  
  // Don't match test data
  if (r.isTestData) return false;
  
  // Match by course code
  return r.courseCode === reserve.courseCode && r.term !== reserve.term;
});
```

**Match Criteria:**
- Same course code (e.g., GOV 234)
- Different term (can't clone from same term)
- Not the current course (no self-cloning)
- Not test data (only real faculty courses)

#### 3. Clone Banner UI

**Design Principles:**
- **Prominent but not intrusive**: Appears at top of editor, easy to dismiss
- **Clear value proposition**: Explains what will happen
- **Two clear choices**: Clone or start fresh
- **Helpful tips**: Explains benefits of cloning
- **Visual hierarchy**: Blue gradient, icon, clear CTAs

**Banner Text:**
```
🔵 Copy Materials from a Previous Term?

We found previous versions of GOV 234 with materials. 
Would you like to copy them to this course and then make any needed changes?

[Copy from Previous Term]  [Start Fresh Instead]

💡 Tip: Copying saves time! You can edit or remove any materials after copying.
```

### Test the Workflow

#### Setup
1. **Create a "previous" course:**
   ```
   Course Code: GOV 234
   Term: Winter 2026
   Add 15-20 materials (books, articles, etc.)
   ```

2. **Create a "current" course (simulating registrar import):**
   ```
   Course Code: GOV 234  
   Term: Spring 2026
   Leave empty (0 materials)
   ```

#### Test Steps
1. Go to Dashboard
2. Find "GOV 234 (Spring 2026)" card
3. Click "Open" button
4. **Expected**: Banner appears suggesting to copy from Winter 2026
5. Click "Copy from Previous Term"
6. **Expected**: Confirmation dialog shows details
7. Confirm
8. **Expected**: All 15-20 materials appear in editor
9. Edit/remove materials as needed
10. Submit course

#### Verification Checklist
- [ ] Banner only shows when course is empty
- [ ] Banner shows correct previous term
- [ ] "Start Fresh" dismisses banner
- [ ] "Copy from Previous" shows confirmation
- [ ] Confirmation shows material count
- [ ] Materials copy successfully
- [ ] Copied materials are editable
- [ ] Folders copy (if any exist)
- [ ] Item statuses reset to 'draft'
- [ ] No duplicate courses created

## Future Enhancements

### Phase 1: Better Matching (Immediate)
- [ ] Show ALL matching courses, not just most recent
- [ ] Let faculty choose which term to clone from
- [ ] Show preview of materials before cloning
- [ ] Display material count in banner

### Phase 2: Smart Suggestions (Near-term)
- [ ] Match by instructor name for shared courses
- [ ] Suggest related courses (similar course codes)
- [ ] Show material age/last used date
- [ ] Flag outdated materials (old editions, broken links)

### Phase 3: Registrar Integration (Long-term)
- [ ] Automatic course import on login
- [ ] Real-time sync with registration system
- [ ] Handle cross-listed courses
- [ ] Support for team-taught courses

### Phase 4: Advanced Features (Future)
- [ ] Selective cloning (choose specific materials)
- [ ] Bulk operations (clone multiple courses)
- [ ] Material library (share across courses)
- [ ] Template courses for common classes

## User Feedback Points

### Questions to Ask Faculty

1. **Discoverability**
   - "Did you notice the clone option when opening an empty course?"
   - "Was it clear what would happen if you clicked 'Copy from Previous Term'?"

2. **Clarity**
   - "Did you understand which previous course would be copied?"
   - "Was it obvious that you could edit materials after copying?"

3. **Workflow**
   - "Does this match how you think about preparing course reserves?"
   - "Would you prefer to see material previews before copying?"

4. **Concerns**
   - "Are you worried about accidentally copying outdated materials?"
   - "Do you want more control over what gets copied?"

## Technical Notes

### Data Flow

```typescript
// When editor loads empty course
useEffect(() => {
  if (reserve.items.length === 0) {
    // Find matches
    const matches = reserves.filter(r => 
      r.courseCode === reserve.courseCode && 
      r.term !== reserve.term
    );
    
    if (matches.length > 0) {
      setShowCloneSuggestion(true);
    }
  }
}, [reserve]);

// When user clicks clone
const handleCloneFromPrevious = () => {
  // Get most recent match
  const source = matches[0];
  
  // Copy all items into CURRENT course
  source.items.forEach(item => {
    addItem(currentCourseId, {
      ...item,
      status: 'draft'
    });
  });
  
  // Copy folders
  source.folders.forEach(folder => {
    createFolder(currentCourseId, folder.title);
  });
};
```

### State Management

**Key Zustand Actions Used:**
- `getReserveById(id)` - Get current course
- `reserves` - Get all courses for matching
- `addItem(courseId, item)` - Copy individual items
- `createFolder(courseId, title)` - Copy folders
- `getReserveStats(id)` - Show material count in confirmation

**Why Not Use `cloneReserve()`?**
The existing `cloneReserve()` function creates a NEW course. We want to populate the EXISTING course instead. This is a fundamental difference in approach.

### Edge Cases Handled

1. **No previous courses**: Banner doesn't show
2. **Multiple previous courses**: Selects most recent automatically
3. **Course has some materials**: Banner doesn't show (not empty)
4. **Test data**: Excluded from matching
5. **Same term**: Can't clone from same term (meaningless)

### Edge Cases NOT Yet Handled

1. **Cross-listed courses**: How to match PHIL 101 / REL 101?
2. **Course renumbering**: GOV 201 → GOV 202
3. **Multiple sections**: Which section to clone from?
4. **Shared courses**: Multiple instructors, who owns materials?

## Comparison: Old vs New

| Aspect | Old Workflow | New Workflow |
|--------|-------------|--------------|
| **Course creation** | Manual form entry | Auto-imported from registrar |
| **Clone trigger** | Separate "Clone Previous" page | Inline suggestion in editor |
| **Result** | Creates new course | Populates current course |
| **Discovery** | Have to know to go back | Automatic when course empty |
| **Steps** | 5-7 clicks | 2-3 clicks |
| **Confusion** | "Why do I have two GOV 234?" | "Materials are ready to edit" |

## Success Metrics

### Quantitative
- **Time to first submission**: Should decrease 50%+
- **Clone usage rate**: Target 70%+ of repeat courses
- **Duplicate courses created**: Should drop to near 0
- **Support tickets**: Expect decrease in "how do I copy materials?"

### Qualitative
- Faculty report workflow is "intuitive"
- Less confusion about course creation
- Positive feedback on time savings
- Fewer "where are my materials?" questions

## Related Documentation

- `CLONE_MATCHING_WORKFLOW.md` - Original matching system design
- `courseReservesStore.ts` - State management implementation
- `SubmissionEditor.tsx` - Main editor component
