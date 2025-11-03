# Edit Submission UX Improvements

## Overview
Enhanced the submission editor UI to clearly differentiate between creating a new submission and editing an existing one, with appropriate features and messaging for each mode.

## Changes Made

### 1. Mode Detection
Added automatic detection of edit mode based on submission status:

```typescript
const isEditingSubmission = reserve.status === 'submitted';
```

### 2. Header Badge
**Location:** Header navigation breadcrumb

**Before:**
```
My Course Reserves / ENGL-101 (Spring 2024)
```

**After (when editing):**
```
My Course Reserves / ENGL-101 (Spring 2024) [Editing Submission]
```

Shows a clear "Editing Submission" badge to indicate the user is modifying an existing submission.

### 3. Submit Button Text
**Location:** Top-right header actions

**Create Mode:**
- Button text: **"Submit to Library"**
- Indicates initial submission to library staff

**Edit Mode:**
- Button text: **"Update Submission"**
- Clearly indicates updating existing submission

### 4. Hidden Features When Editing
The following features are now **hidden during edit mode** since they're only relevant for new submissions:

#### a) Duplicate Previous Course Button
- **What:** Quick-submit button for indicating reuse of previous materials
- **Why hidden:** Not applicable when editing existing submission
- **Location:** Header actions (amber/yellow button)

#### b) Clone Suggestion Banner
- **What:** Smart banner suggesting to copy from previous course offerings
- **Why hidden:** User already has items and doesn't need to clone
- **Location:** Top of items list area

### 5. Confirmation Dialog Changes

#### Create Mode Dialog
**Title:** "Submit to Library?"

**Message:**
> You are submitting X items for COURSE-CODE · TERM. You won't be able to edit items after submission, but you can add notes.

**Features:**
- Email confirmation checkbox
- "Submit" button

#### Edit Mode Dialog  
**Title:** "Update Submission?"

**Message:**
> You are updating your submission for COURSE-CODE · TERM. This will replace the current submission with X items organized in Y folder(s).

**Features:**
- No email confirmation checkbox (not needed for updates)
- "Update" button (instead of "Submit")
- Clearer messaging about what's being updated

## User Experience Flow

### Creating New Submission
1. User creates new course or duplicates previous
2. Header shows course code only (no badge)
3. "Duplicate Previous Course" button visible
4. Clone suggestion banner may appear
5. Submit button says "Submit to Library"
6. Confirmation dialog has email checkbox
7. On submit → Creates new submission via POST

### Editing Existing Submission
1. User clicks "Edit Submission" from detail page
2. **Header shows "Editing Submission" badge**
3. **"Duplicate Previous Course" button hidden**
4. **Clone suggestion banner hidden**
5. **Submit button says "Update Submission"**
6. **Confirmation dialog simplified (no email checkbox)**
7. On submit → Updates submission via PUT

## Visual Indicators Summary

| Feature | Create Mode | Edit Mode |
|---------|------------|-----------|
| Header Badge | None | "Editing Submission" |
| Submit Button | "Submit to Library" | "Update Submission" |
| Duplicate Button | ✅ Visible | ❌ Hidden |
| Clone Banner | ✅ Can appear | ❌ Hidden |
| Dialog Title | "Submit to Library?" | "Update Submission?" |
| Email Checkbox | ✅ Shown | ❌ Hidden |
| Dialog Button | "Submit" | "Update" |

## Benefits

1. **Clear Context** - Users always know if they're creating or editing
2. **Reduced Clutter** - Irrelevant features hidden during edit mode
3. **Appropriate Messaging** - Different confirmation text for different actions
4. **Better Workflow** - Email confirmation only needed for initial submission
5. **Less Confusion** - Clone/duplicate features don't appear when editing

## Technical Implementation

All changes are purely UI-based using the `isEditingSubmission` flag. The underlying submission handler already detects the mode and routes to the correct endpoint (POST vs PUT).

**Key Files Modified:**
- `src/pages/SubmissionEditor.tsx` - All UI conditional rendering

**No Backend Changes Required** - Backend integration already complete from previous work.

## Testing Scenarios

### Create Mode
- [ ] Header shows no badge
- [ ] "Duplicate Previous Course" button visible
- [ ] Clone banner can appear (if previous courses exist)
- [ ] Submit button says "Submit to Library"
- [ ] Confirmation shows email checkbox
- [ ] Dialog button says "Submit"

### Edit Mode  
- [ ] Header shows "Editing Submission" badge
- [ ] "Duplicate Previous Course" button hidden
- [ ] Clone banner never appears
- [ ] Submit button says "Update Submission"
- [ ] Confirmation has no email checkbox
- [ ] Dialog button says "Update"
- [ ] Shows folder count if folders exist

### Mode Detection
- [ ] Draft courses → Create mode
- [ ] In-progress courses → Create mode
- [ ] Submitted courses → Edit mode
- [ ] Correct API endpoint used (POST vs PUT)
