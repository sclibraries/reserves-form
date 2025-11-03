# Editable Submitted Courses Feature

## Overview
Faculty can now edit and delete submitted course reserves until a staff member locks the course for processing. This gives faculty flexibility to make changes while ensuring staff can lock courses when they begin work.

## Features

### 1. Edit Submitted Courses ✏️
Faculty can continue editing submitted courses to:
- Add or remove materials
- Reorder items
- Create and organize folders
- Update course details
- Add notes and descriptions

**Requirements:**
- Course status must be `submitted`
- Course must NOT be locked by staff (`assigneeStaffUserId` is null)

### 2. Delete Submitted Courses 🗑️
Faculty can delete entire submissions that haven't been locked.

**Requirements:**
- Course status must be `submitted`
- Course must NOT be locked by staff

### 3. Staff Locking 🔒
When staff assigns themselves to a course:
- The `assigneeStaffUserId` field is set to the staff member's ID
- The `isLocked` flag becomes `true`
- Faculty can NO LONGER edit or delete the submission
- A "Locked by Staff" badge appears in the UI

## Implementation Details

### Backend Data Model

Added two new fields to `CourseReserve` interface:

```typescript
export interface CourseReserve {
  // ... existing fields
  assigneeStaffUserId?: string | null;  // ID of staff member who locked the course
  isLocked?: boolean;                   // Computed: true if assigneeStaffUserId is set
}
```

### API Integration

#### Fetch Submission Details
The `fetchSubmissionDetails` function now extracts locking information:

```typescript
const reserve: CourseReserve = {
  // ... other fields
  assigneeStaffUserId: submission.assignee_staff_user_id || null,
  isLocked: !!submission.assignee_staff_user_id,
};
```

#### Delete Submission
New API function added to store:

```typescript
deleteSubmission: async (submissionId: string) => Promise<boolean>
```

**Endpoint:** `DELETE /faculty-submission/{submissionId}`

**Returns:** 
- `true` on success
- Throws error if deletion fails (e.g., course is locked)

### UI Components

#### SubmissionDetail Page Enhancements

**Header Actions:**
```tsx
{canEdit && (
  <>
    <Button variant="outline" onClick={handleEditSubmission}>
      <Pencil className="mr-2 h-4 w-4" />
      Edit Submission
    </Button>
    <Button 
      variant="outline" 
      onClick={() => setShowDeleteDialog(true)}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  </>
)}
```

**Locked Badge:**
```tsx
{reserve.isLocked && (
  <Badge variant="secondary" className="flex items-center gap-1">
    <Lock className="h-3 w-3" />
    Locked by Staff
  </Badge>
)}
```

**Delete Confirmation Dialog:**
- Shows course details and item count
- Warns that action cannot be undone
- Disabled while deleting (prevents double-clicks)
- Navigates to dashboard on success

## User Flows

### Faculty Edit Flow

```
1. Faculty submits course
2. Realizes they need to add materials
3. Views submission detail page
4. Sees "Edit Submission" button (course not locked)
5. Clicks Edit → Redirected to /submission/{id}/edit
6. Makes changes (add items, reorder, etc.)
7. Re-submits with "Submit to Library" button
8. Updated submission sent to backend with refresh
```

### Faculty Delete Flow

```
1. Faculty submits course
2. Realizes it's the wrong course
3. Views submission detail page  
4. Sees "Delete" button (course not locked)
5. Clicks Delete → Confirmation dialog appears
6. Confirms deletion
7. Backend deletes submission
8. Redirected to dashboard
```

### Staff Lock Flow

```
1. Staff reviews submitted course
2. Assigns themselves to process it
3. Backend sets assignee_staff_user_id
4. Faculty views the submission
5. Sees "Locked by Staff" badge
6. Edit and Delete buttons are HIDDEN
7. Faculty can only view and add messages
```

## Conditional Logic

### Can Edit/Delete Check

```typescript
const canEdit = reserve && !reserve.isLocked && reserve.status === 'submitted';
```

This ensures:
- ✅ Reserve exists
- ✅ Not locked by staff
- ✅ Status is 'submitted' (not draft or complete)

### Button Visibility

Edit and Delete buttons only render when `canEdit` is true.

### Error Handling

If backend rejects deletion (e.g., course was just locked):
- Toast error message shown
- User remains on page
- Can try refreshing to see updated status

## Backend Requirements

### DELETE Endpoint

**URL:** `DELETE /faculty-submission/{submissionId}`

**Headers:**
- `Authorization: Bearer {token}`
- `Accept: application/json`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Submission deleted successfully"
}
```

**Error Response (403 - Locked):**
```json
{
  "success": false,
  "error": "Cannot delete submission: currently assigned to staff"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Submission not found"
}
```

### Staff Assignment

When staff assigns themselves:

**Database Update:**
```sql
UPDATE course_reserves 
SET assignee_staff_user_id = '{staff_id}',
    updated_at = NOW()
WHERE submission_uuid = '{uuid}';
```

**API Response:**
```json
{
  "submission": {
    "submission_uuid": "abc-123",
    "assignee_staff_user_id": "staff-456",
    ...
  }
}
```

### Staff Unlock (Future Enhancement)

To allow staff to unlock:

**URL:** `POST /faculty-submission/{submissionId}/unlock`

**Action:**
```sql
UPDATE course_reserves 
SET assignee_staff_user_id = NULL,
    updated_at = NOW()
WHERE submission_uuid = '{uuid}';
```

## Visual Design

### Unlocked State
```
┌─────────────────────────────────────────────────────────────┐
│ ← | My Course Reserves / GOV 201 (2026 Winter)              │
│                                                              │
│   [Submitted]  [Edit Submission]  [Delete]                  │
└─────────────────────────────────────────────────────────────┘
```

### Locked State
```
┌─────────────────────────────────────────────────────────────┐
│ ← | My Course Reserves / GOV 201 (2026 Winter) 🔒 Locked by │
│                                                      Staff   │
│   [Submitted]                                                │
└─────────────────────────────────────────────────────────────┘
```

## Testing Checklist

### Faculty Actions
- [ ] Can edit unlocked submitted course
- [ ] Changes save successfully
- [ ] Can re-submit after editing
- [ ] Can delete unlocked submitted course
- [ ] Deletion confirmation appears
- [ ] Redirected to dashboard after delete
- [ ] Cannot edit locked course
- [ ] Cannot delete locked course
- [ ] Edit/Delete buttons hidden when locked
- [ ] "Locked by Staff" badge appears when locked

### Staff Actions
- [ ] Staff can assign course to themselves
- [ ] Assignment locks the course
- [ ] Locked status persists across refreshes
- [ ] Staff can unlock course (future feature)

### Edge Cases
- [ ] Deletion fails gracefully if course locked mid-delete
- [ ] Edit attempt fails gracefully if course locked mid-edit
- [ ] Proper error messages shown
- [ ] UI updates when lock status changes
- [ ] Polling detects lock status changes

## Benefits

✅ **Faculty Flexibility**: Faculty can fix mistakes after submission  
✅ **Staff Control**: Staff can lock courses when starting work  
✅ **Clear Communication**: Locked badge clearly indicates status  
✅ **Error Prevention**: Cannot delete/edit once staff is working  
✅ **Better UX**: No need to contact staff for minor changes  
✅ **Audit Trail**: Staff assignment tracked in database  

## Future Enhancements

1. **Staff Unlock Button**: Allow staff to unlock courses for faculty edits
2. **Lock Notifications**: Notify faculty when course is locked
3. **Edit History**: Track all edits made to submissions
4. **Partial Locks**: Lock individual items instead of whole submission
5. **Time-based Locks**: Auto-unlock after certain period of inactivity
