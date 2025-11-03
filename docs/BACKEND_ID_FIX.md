# Backend ID Preservation Fix

## Problem

When updating a submission, the system was creating duplicate "Untitled" items and losing folder associations because:

1. **Frontend IDs vs Backend IDs Mismatch**
   - Frontend stores items with prefixed IDs: `material-259`, `material-260`, etc.
   - Backend expects raw database IDs: `259`, `260`, etc.
   - Update payload was sending `material-259` which backend didn't recognize
   - Backend created new items for unrecognized IDs → "Untitled" items

2. **Folder ID Issues**
   - Same problem with folders: `folder-16` vs `16`
   - Items lost their folder associations

## Root Cause

The frontend adds prefixes to backend IDs to avoid collisions and make debugging easier:

```typescript
// In fetchSubmissionDetails
id: `material-${material.id}`,  // material-259
id: `folder-${folder.id}`,      // folder-16
```

But when updating, we were sending these prefixed IDs back to the backend, which expects the raw database IDs.

## Solution

### 1. Added Backend ID Storage

Updated `CourseItem` and `CourseFolder` interfaces to store the original backend IDs:

```typescript
export interface CourseItem {
  id: string;                    // Frontend ID: "material-259"
  backendItemId?: string;        // Backend ID: "259" ← NEW
  // ... other fields
}

export interface CourseFolder {
  id: string;                    // Frontend ID: "folder-16"
  backendFolderId?: string;      // Backend ID: "16" ← NEW
  // ... other fields
}
```

### 2. Store Backend IDs on Fetch

When fetching submission details, now preserves the backend IDs:

```typescript
// Folder items
backendItemId: String(material.id), // "259"

// Folders
backendFolderId: String(folder.id), // "16"

// Unfoldered items
backendItemId: String(material.id), // "260"
```

### 3. Use Backend IDs in Updates

Updated the submission handler to use backend IDs when updating:

```typescript
// For folders
folder_uuid: folder.backendFolderId || folder.id.replace('folder-', ''),

// For items
item_uuid: sourceItem?.backendItemId || sourceItem?.id.replace('material-', ''),

// For folder associations
folder_uuid: foldersWithItems.find(...)?.backendFolderId || ...
```

The `.replace()` fallbacks handle cases where items are newly added (don't have backend IDs yet).

### 4. Preserve in Handler

Updated `confirmSubmit` to preserve backend IDs when mapping folders:

```typescript
const foldersWithItems = organizedContent.folders.map((folder) => ({
  id: folder.id,
  backendFolderId: folder.backendFolderId, // ← Preserve this
  title: folder.title,
  // ...
}));
```

## Before vs After

### Before (Broken Update)
```json
{
  "items": [
    {
      "item_uuid": "material-259",  // ❌ Backend doesn't recognize this
      "folder_uuid": "folder-16",    // ❌ Backend doesn't recognize this
      "title": "Some Book",
      ...
    }
  ]
}
```
**Result:** Backend creates new "Untitled" items because IDs don't match

### After (Fixed Update)
```json
{
  "items": [
    {
      "item_uuid": "259",    // ✅ Backend recognizes and updates existing item
      "folder_uuid": "16",   // ✅ Backend preserves folder association
      "title": "Some Book",
      ...
    }
  ]
}
```
**Result:** Backend updates existing items correctly

## Files Modified

1. **`/src/store/courseReservesStore.ts`**
   - Added `backendItemId` to `CourseItem` interface
   - Added `backendFolderId` to `CourseFolder` interface
   - Store backend IDs when fetching submission details (3 places: folder items, folders, unfoldered items)

2. **`/src/handlers/submissionHandlers.ts`**
   - Use `backendItemId` for `item_uuid` in update payload
   - Use `backendFolderId` for `folder_uuid` and folder associations
   - Preserve `backendFolderId` when mapping folders in `confirmSubmit`

## Testing

### Verify Fix Works
1. Edit an existing submitted course
2. Reorder items or move between folders
3. Update submission
4. Check backend response:
   - ✅ No new "Untitled" items created
   - ✅ Folder names preserved correctly
   - ✅ Item titles and data intact
   - ✅ Same item IDs as before (no duplicates)

### Test New Item Additions
1. Edit existing submission
2. Add a brand new item (won't have backendItemId yet)
3. Update submission
4. Should work: Fallback to `.replace('material-', '')` handles this

## Why Prefixes Exist

The frontend uses prefixes (`material-`, `folder-`) to:
- Avoid ID collisions between different entity types
- Make debugging easier (you can tell what type an ID refers to)
- Support local-only items (created but not yet submitted)

The prefixes are purely a frontend concern and stripped out when communicating with the backend.

## Backward Compatibility

- Existing items without `backendItemId`: Fallback to `.replace()` strips prefix
- New items (never submitted): ID generation creates unique IDs
- Mixed submissions (some updated, some new): Both cases handled

No breaking changes to existing functionality!
