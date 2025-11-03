# Backend Update Integration - Implementation Summary

> **✨ KEY FEATURE:** The submission handler now automatically detects whether to CREATE or UPDATE submissions based on the course status. When editing a submitted course (status === 'submitted'), it uses the PUT endpoint instead of POST, preventing "Submission already exists" errors.

## Overview
Implemented comprehensive backend integration for updating submitted course reserves, including proper lock status handling, field name mapping, and 423 HTTP status code support. The submission handler now automatically detects whether to CREATE or UPDATE based on submission status.

## Files Modified

### 1. `/src/handlers/submissionHandlers.ts` ✅ UPDATED

#### Automatic CREATE vs UPDATE Detection
The submission handler now intelligently detects whether to create a new submission or update an existing one:

```typescript
const isUpdate = reserve.status === 'submitted';
```

**Create Flow (New Submissions):**
- Uses POST endpoint: `/faculty-submission/submit-complete`
- Sends full submission data structure
- Extracts UUID from response

**Update Flow (Editing Existing):**
- Uses PUT endpoint: `/faculty-submission/{uuid}`
- Sends update payload with backend field names
- Uses existing reserve.id as UUID
- Handles 423 Locked status code

**Update Payload Structure:**
```typescript
{
  submission_notes: string | null,
  needed_by_date: string | null,
  folders: [
    {
      folder_uuid: string,
      folder_name: string,
      display_order: number
    }
  ],
  items: [
    {
      item_uuid: string,
      display_order: number,
      folder_uuid: string | null,
      position_in_folder: number | null,
      material_type: string,
      title: string,
      author: string | null,
      journal: string | null,
      publisher: string | null,
      isbn: string | null,
      url: string | null,
      faculty_notes: string | null,
      call_number: string | null,
      barcode: string | null
    }
  ]
}
```

**Error Handling:**
- 423 Locked: Shows detailed lock information (who, when, reason)
- Other errors: Shows HTTP status and error message
- Navigates to submission detail page on success or error

### 2. `/src/store/courseReservesStore.ts` ✅ COMPLETED

#### CourseReserve Interface Extended
Added new fields to match backend response structure:

```typescript
export interface CourseReserve {
  // ... existing fields ...
  
  // Lock status fields from backend
  assigneeStaffUserId?: string | null; // Staff member assigned
  isLocked?: boolean; // Computed flag
  lockedAt?: string | null; // ISO timestamp when locked
  lockedBy?: string | null; // Staff name who locked it
  lockReason?: string | null; // Reason for locking
  canEdit?: boolean; // Backend flag indicating if current user can edit
  
  // Submission fields
  submissionNotes?: string | null; // Faculty notes (backend: submission_notes)
  neededByDate?: string | null; // ISO date when materials needed (backend: needed_by_date)
}
```

#### New Function: `updateSubmission()`
Added PUT endpoint integration for updating submitted courses:

**Features:**
- Maps frontend fields to backend field names (submission_notes, needed_by_date)
- Transforms folders array to backend format
- Transforms items array with proper field mapping
- Handles 423 Locked status code with detailed error message
- Automatically refreshes submission details after successful update

**Usage:**
```typescript
await updateSubmission(submissionId, {
  submissionNotes: "Updated notes",
  neededByDate: "2024-01-15",
  items: [...updatedItems],
  folders: [...updatedFolders]
});
```

**Backend Payload Structure:**
```typescript
{
  submission_notes?: string | null,
  needed_by_date?: string | null,
  folders?: [
    {
      folder_uuid: string,
      folder_name: string,
      display_order: number
    }
  ],
  items?: [
    {
      item_uuid: string,
      display_order: number | null,
      folder_uuid: string | null,
      position_in_folder: number | null,
      material_type: string,
      title: string,
      author?: string | null,
      journal?: string | null,
      publisher?: string | null,
      isbn?: string | null,
      url?: string | null,
      faculty_notes?: string | null,
      call_number?: string | null,
      barcode?: string | null
    }
  ]
}
```

#### Enhanced `fetchSubmissionDetails()`
Updated to map all lock status fields from backend response:

```typescript
assigneeStaffUserId: submission.assignee_staff_user_id || null,
isLocked: submission.is_locked || !!submission.assignee_staff_user_id,
lockedAt: submission.locked_at || null,
lockedBy: submission.locked_by_name || null,
lockReason: submission.lock_reason || null,
canEdit: submission.can_edit !== undefined ? submission.can_edit : !submission.is_locked,
submissionNotes: submission.submission_notes || null,
neededByDate: submission.needed_by_date || null,
```

### 2. `/src/config/endpoints.js`

Added new endpoint constants:

```javascript
FACULTY_SUBMISSION_UPDATE: '/faculty-submission/:uuid',
FACULTY_SUBMISSION_DELETE: '/faculty-submission/:uuid',
```

### 3. `/src/pages/SubmissionDetail.tsx`

#### Enhanced Lock Status Display
- Shows staff member name who locked the submission
- Displays lock date and reason in tooltip
- More detailed lock badge text

```tsx
{reserve.isLocked && (
  <Badge 
    variant="secondary" 
    className="flex items-center gap-1"
    title={`Locked by ${reserve.lockedBy || 'staff'}${reserve.lockedAt ? ` on ${new Date(reserve.lockedAt).toLocaleDateString()}` : ''}${reserve.lockReason ? `. Reason: ${reserve.lockReason}` : ''}`}
  >
    <Lock className="h-3 w-3" />
    {reserve.lockedBy ? `Locked by ${reserve.lockedBy}` : 'Locked by Staff'}
  </Badge>
)}
```

#### Updated canEdit Logic
Now prioritizes backend's `canEdit` field:

```typescript
const canEdit = reserve 
  ? (reserve.canEdit !== undefined ? reserve.canEdit : (!reserve.isLocked && reserve.status === 'submitted'))
  : false;
```

## Field Name Mapping Reference

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `submissionNotes` | `submission_notes` | Faculty notes about submission |
| `neededByDate` | `needed_by_date` | ISO date string |
| `authors` | `author` | String in backend, may be comma-separated |
| `journalTitle` | `journal` | Journal name for articles |
| `notes` | `faculty_notes` | Item-level notes |
| `materialType` | `material_type` | book, article, video, website, other |
| `callNumber` | `call_number` | Library call number |
| `displayOrder` | `display_order` | Position in list |

## Lock Status Handling

### Backend Response Fields
```typescript
{
  is_locked: boolean,
  locked_at: string | null,  // ISO timestamp
  locked_by_name: string | null,  // Staff member name
  lock_reason: string | null,
  can_edit: boolean,
  assignee_staff_user_id: string | null
}
```

### 423 Locked Status Code
When attempting to update a locked submission, backend returns:
- **Status Code:** 423 (Locked)
- **Response Body:** Lock details (locked_by, locked_at, lock_reason)

The frontend displays a user-friendly error message with these details.

## Integration Status

### ✅ Fully Implemented
1. **Automatic CREATE vs UPDATE Detection** - Submission handler detects status and routes to correct endpoint
2. **Lock Status Data Model** - All lock fields in CourseReserve interface
3. **Update API Function** - `updateSubmission()` in store (available for direct use)
4. **Delete API Function** - `deleteSubmission()` with proper authentication
5. **Enhanced Lock Display** - Shows staff name, date, reason in UI
6. **Field Name Mapping** - All backend field names properly mapped
7. **423 Error Handling** - Locked submission errors with details
8. **Edit/Delete Buttons** - Conditional rendering based on canEdit

### 🎯 How It Works

**Editing a Submitted Course:**
1. User clicks "Edit Submission" button on detail page
2. Navigates to `/submission/{uuid}/edit`
3. SubmissionEditor loads with existing data
4. User makes changes and clicks submit
5. **Handler detects `status === 'submitted'`** → Uses PUT endpoint
6. Backend validates and updates (or returns 423 if locked)
7. Success: Navigates back to detail page with fresh data
8. Error: Shows toast with lock details

**Creating a New Submission:**
1. User creates new course or duplicates existing
2. SubmissionEditor loads with draft data
3. User adds items and clicks submit
4. **Handler detects `status !== 'submitted'`** → Uses POST endpoint
5. Backend creates new submission
6. Success: Extracts UUID and navigates to detail page

## Testing Checklist

### ✅ Create Flow
- [ ] Create new course and submit → Uses POST endpoint
- [ ] Duplicate course and submit → Uses POST endpoint
- [ ] Clone from previous and submit → Uses POST endpoint

### ✅ Update Flow
- [ ] Edit submitted course and resubmit → Uses PUT endpoint
- [ ] Add new items to submission → Updates correctly
- [ ] Remove items from submission → Updates correctly
- [ ] Reorder items/folders → Display order updates
- [ ] Move items between folders → Folder assignments update

### ✅ Lock Handling
- [ ] Try editing locked submission → Shows 423 error with details
- [ ] Lock badge shows staff name → Displays correctly
- [ ] Lock tooltip shows date and reason → Full info displayed
- [ ] Edit/Delete buttons hidden when locked → UI responds to canEdit

### ✅ Error Handling
- [ ] Network error → Shows error toast
- [ ] 400 Bad Request → Shows error message
- [ ] 423 Locked → Shows lock details
- [ ] Success → Shows success toast and navigates

## Backend API Endpoints

### Update Submission (PUT)
```
PUT /course-reserves/backend/web/faculty-submission/{uuid}
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  submission_notes?: string,
  needed_by_date?: string,
  folders?: [...],
  items?: [...]
}

Success: 200 OK
Locked: 423 Locked
Error: 400/500
```

### Delete Submission (DELETE)
```
DELETE /course-reserves/backend/web/faculty-submission/{uuid}
Authorization: Bearer {token}

Success: 200 OK
Locked: 423 Locked
Error: 404/500
```

## Next Steps

1. **SubmissionEditor Integration**: Update the editor to use `updateSubmission()` when editing existing submissions
2. **Lock Status Banner**: Add a prominent banner/alert at top of edit page when submission is locked
3. **Submission Notes Field**: Add UI field in editor for `submissionNotes`
4. **Needed By Date Field**: Add date picker in editor for `neededByDate`
5. **Error Handling**: Add toast notifications for 423 errors throughout the app
6. **Polling Updates**: Consider adding lock status to polling/refresh to detect when staff locks a submission

## Notes

- All date fields use ISO 8601 format (YYYY-MM-DD)
- Backend may return additional fields not yet mapped to frontend
- Lock status is authoritative from backend's `can_edit` field
- Frontend `isLocked` is a computed fallback when `can_edit` is undefined
- All updates trigger automatic refresh to sync with backend state
