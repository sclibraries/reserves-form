# Backend Physical Item Integration Complete! 🎉

## Overview

The submission system now properly handles physical item metadata from FOLIO, mapping it to the new `submission_new_resources` table structure with support for reuse tracking.

## Database Schema Mapping

### New Backend Table: `submission_new_resources`

The system now maps physical items to these database fields:

| Frontend Field | Database Field | Description |
|----------------|----------------|-------------|
| `barcode` | `source_barcode` | Barcode of physical item being reused |
| `callNumber` | `source_call_number` | Call number of physical item |
| `holdingsId` | `source_resource_id` | FOLIO holdings ID |
| `instanceId` | `source_folio_instance_id` | FOLIO instance ID |
| `copy` | (in resource_data) | Copy number (e.g., "1", "2") |
| `copiedItem` | `resource_data` | Full FOLIO item data (JSON) |
| `folderId` | `folder_name` | Folder this item belongs to |
| - | `display_order` | Position in submission |
| - | `position_in_folder` | Position within folder |
| - | `is_reuse` | Auto-detected: true if has barcode/call number |
| `notes` | `faculty_notes` | Faculty notes |
| `status` | `priority` | Mapped: needs-review → high, else medium |

## Updated Data Structures

### CourseItem Type (Extended)

```typescript
export interface CourseItem {
  // Original fields...
  id: string;
  title: string;
  authors?: string;
  materialType: 'book' | 'article' | 'chapter' | 'video' | 'website' | 'other';
  status: 'draft' | 'in-progress' | 'complete' | 'needs-review';
  
  // NEW: Physical item metadata (for reuse from previous courses)
  barcode?: string;              // Maps to source_barcode
  callNumber?: string;           // Maps to source_call_number
  copy?: string;                 // Copy number
  instanceId?: string;           // FOLIO instance ID → source_folio_instance_id
  holdingsId?: string;           // FOLIO holdings ID → source_resource_id
  instanceHrid?: string;         // FOLIO instance human-readable ID
  
  // NEW: Location information
  temporaryLocationId?: string;
  temporaryLocationObject?: FolioLocation;
  permanentLocationId?: string;
  permanentLocationObject?: FolioLocation;
  
  // NEW: Full copiedItem data from FOLIO (preserved for backend)
  copiedItem?: FolioCopiedItem;
}
```

### FolioCopiedItem Type

```typescript
export interface FolioCopiedItem {
  barcode?: string;
  callNumber?: string;
  copy?: string;
  instanceId?: string;
  instanceHrid?: string;
  instanceDiscoverySuppress?: boolean;
  holdingsId?: string;
  title?: string;
  contributors?: Array<{
    name: string;
    contributorTypeId?: string;
    contributorTypeText?: string;
    contributorNameTypeId?: string;
    primary?: boolean;
  }>;
  publication?: Array<{
    publisher?: string;
    place?: string;
    dateOfPublication?: string;
    role?: string;
  }>;
  temporaryLocationId?: string;
  temporaryLocationObject?: FolioLocation;
  permanentLocationId?: string;
  permanentLocationObject?: FolioLocation;
  effectiveCallNumberComponents?: {
    callNumber?: string;
  };
}
```

## Transformation Logic

### transformItemForBackend()

New helper function in `submissionHandlers.ts`:

```typescript
const transformItemForBackend = (item: CourseItem, displayOrder: number, folderName?: string) => {
  // Auto-detect reuse items
  const isReuse = !!(item.barcode || item.callNumber || item.holdingsId);
  
  return {
    // Reuse metadata
    is_reuse: isReuse,
    source_barcode: item.barcode || null,
    source_call_number: item.callNumber || null,
    source_resource_id: item.holdingsId || null,
    source_folio_instance_id: item.instanceId || null,
    
    // Organization
    display_order: displayOrder,
    folder_name: folderName || null,
    position_in_folder: item.folderId ? displayOrder : null,
    
    // Faculty notes
    faculty_notes: item.notes || null,
    
    // Priority
    priority: item.status === 'needs-review' ? 'high' : 'medium',
    
    // Full resource data (JSON)
    resource_data: {
      // All CourseItem fields
      // Plus FOLIO metadata
      // Plus copiedItem (complete FOLIO data)
    }
  };
};
```

## Updated Files

### 1. `courseReservesStore.ts`
**Added Types:**
- `FolioLocation` - FOLIO location structure
- `FolioCopiedItem` - Complete FOLIO item data
- Extended `CourseItem` with physical metadata fields

### 2. `submissionHandlers.ts`
**Added Function:**
- `transformItemForBackend()` - Transforms CourseItem to backend format

**Updated Functions:**
- `confirmSubmit()` - Now sends `resources` array with transformed items
- `confirmDuplicateSubmit()` - Same transformation logic

**New Submission Data Structure:**
```json
{
  "reserveId": "reserve-123",
  "courseInfo": { ... },
  "items": [ ... ],           // Original format (backward compatible)
  "resources": [              // NEW: Transformed format
    {
      "is_reuse": true,
      "source_barcode": "310183604356911",
      "source_call_number": "HB3595 .K53 1988",
      "source_resource_id": "b3a8725b-15d4-5bc6-bc99-258f044206c8",
      "source_folio_instance_id": "422035c1-e7f4-548d-aace-356f082ccd0b",
      "display_order": 0,
      "folder_name": null,
      "position_in_folder": null,
      "faculty_notes": "Call Number: HB3595 .K53 1988 | Barcode: 310183604356911",
      "priority": "medium",
      "resource_data": {
        "id": "item-1",
        "title": "Demographic behavior in the past...",
        "authors": "Knodel, John E",
        "materialType": "book",
        "barcode": "310183604356911",
        "callNumber": "HB3595 .K53 1988",
        "copy": "1",
        "instanceId": "422035c1-e7f4-548d-aace-356f082ccd0b",
        "holdingsId": "b3a8725b-15d4-5bc6-bc99-258f044206c8",
        "copiedItem": { /* Full FOLIO data */ }
      }
    }
  ],
  "folders": [ ... ],
  "metadata": {
    "totalItems": 16,
    "reuseItems": 16,          // NEW: Count of reuse items
    "newItems": 0,             // NEW: Count of new items
    "submittedAt": "2025-10-17T...",
    "emailConfirmation": true,
    "submittedBy": { ... }
  }
}
```

### 3. `cloneResourceHandler.ts`
**Updated:**
- `handleAddSingleResource()` - Now preserves all FOLIO metadata when cloning
- Properly extracts and stores:
  - `barcode`, `callNumber`, `copy`
  - `instanceId`, `holdingsId`, `instanceHrid`
  - Location objects
  - Full `copiedItem` data

### 4. `SubmissionEditor.tsx`
**Updated:**
- Duplicate submission button logic
- Preserves FOLIO metadata when fetching previous course resources
- Properly maps physical reserves to CourseItem with all metadata

## Data Flow

### 1. Clone Physical Item from Previous Course

```
User clicks "Copy from Previous" 
  ↓
Fetch previous course resources from FOLIO API
  ↓
Physical reserves include copiedItem with full metadata:
  - barcode: "310183604356911"
  - callNumber: "HB3595 .K53 1988"
  - copy: "1"
  - instanceId: "422035c1-e7f4-548d-aace-356f082ccd0b"
  - holdingsId: "b3a8725b-15d4-5bc6-bc99-258f044206c8"
  - temporaryLocationObject: { ... }
  - permanentLocationObject: { ... }
  ↓
cloneResourceHandler extracts and stores ALL metadata
  ↓
CourseItem created with:
  - Display fields (title, authors, etc.)
  - Physical metadata (barcode, callNumber, etc.)
  - copiedItem (full FOLIO data)
```

### 2. Submit to Backend

```
User clicks "Submit to Library"
  ↓
transformItemForBackend() processes each item:
  - Detects is_reuse = true (has barcode/callNumber)
  - Maps barcode → source_barcode
  - Maps callNumber → source_call_number
  - Maps holdingsId → source_resource_id
  - Maps instanceId → source_folio_instance_id
  - Wraps everything in resource_data JSON
  ↓
POST to /faculty-submission/submit-complete
  ↓
Backend receives resources array with:
  - Reuse flags
  - Source identifiers
  - Complete FOLIO data
  ↓
Backend inserts into submission_new_resources table
```

## Backend Processing Benefits

With this structure, the backend can:

✅ **Quickly identify reuse items** - `is_reuse` flag
✅ **Link to existing inventory** - `source_resource_id`, `source_barcode`
✅ **Skip cataloging for reuse items** - Already in FOLIO
✅ **Process new items separately** - `is_reuse = false`
✅ **Preserve all metadata** - `resource_data` JSON field
✅ **Maintain display order** - `display_order`, `position_in_folder`
✅ **Organize by folders** - `folder_name`

## Example: Physical Item Journey

### Source FOLIO Data
```json
{
  "barcode": "310183604356911",
  "callNumber": "HB3595 .K53 1988",
  "copy": "1",
  "instanceId": "422035c1-e7f4-548d-aace-356f082ccd0b",
  "holdingsId": "b3a8725b-15d4-5bc6-bc99-258f044206c8",
  "title": "Demographic behavior in the past...",
  "contributors": [
    { "name": "Knodel, John E", "primary": true }
  ],
  "publication": [
    { "publisher": "Cambridge University Press", "dateOfPublication": "1988" }
  ],
  "temporaryLocationObject": {
    "name": "SC Neilson Reserve",
    "code": "SNRES"
  },
  "permanentLocationObject": {
    "name": "SC Neilson Stacks",
    "code": "SNSTK"
  }
}
```

### Frontend CourseItem
```typescript
{
  id: "item-1",
  title: "Demographic behavior in the past...",
  authors: "Knodel, John E",
  materialType: "book",
  status: "draft",
  publisher: "Cambridge University Press",
  publicationYear: "1988",
  notes: "Call Number: HB3595 .K53 1988 | Barcode: 310183604356911",
  
  // Physical metadata
  barcode: "310183604356911",
  callNumber: "HB3595 .K53 1988",
  copy: "1",
  instanceId: "422035c1-e7f4-548d-aace-356f082ccd0b",
  holdingsId: "b3a8725b-15d4-5bc6-bc99-258f044206c8",
  temporaryLocationId: "d48db17d-9b8b-4cbe-9ce9-b466f7dccc21",
  temporaryLocationObject: { ... },
  permanentLocationId: "272372df-cbc8-4980-98e4-47f580b5b3b0",
  permanentLocationObject: { ... },
  
  // Complete FOLIO data
  copiedItem: { /* full object */ }
}
```

### Backend submission_new_resources Row
```sql
INSERT INTO submission_new_resources (
  submission_id,
  is_reuse,
  source_barcode,
  source_call_number,
  source_resource_id,
  source_folio_instance_id,
  resource_data,
  display_order,
  faculty_notes,
  priority
) VALUES (
  123,
  1, -- is_reuse = true
  '310183604356911',
  'HB3595 .K53 1988',
  'b3a8725b-15d4-5bc6-bc99-258f044206c8',
  '422035c1-e7f4-548d-aace-356f082ccd0b',
  '{ "id": "item-1", "title": "Demographic...", ... }', -- Full JSON
  0,
  'Call Number: HB3595 .K53 1988 | Barcode: 310183604356911',
  'medium'
);
```

## Testing

### Test 1: Clone Physical Item
```typescript
// 1. Open SubmissionEditor
// 2. Click "Copy from Previous Courses"
// 3. Select a course with physical reserves
// 4. Click add on a physical item
// 5. Verify item has:
console.log(item.barcode);        // "310183604356911"
console.log(item.callNumber);     // "HB3595 .K53 1988"
console.log(item.copy);           // "1"
console.log(item.instanceId);     // "422035c1-e7f4-548d-aace-356f082ccd0b"
console.log(item.holdingsId);     // "b3a8725b-15d4-5bc6-bc99-258f044206c8"
console.log(item.copiedItem);     // { full FOLIO data }
```

### Test 2: Submit with Reuse Items
```typescript
// 1. Create submission with cloned physical items
// 2. Click "Submit to Library"
// 3. Check console for submission data
// 4. Verify resources array has:
console.log(resources[0].is_reuse);              // true
console.log(resources[0].source_barcode);        // "310183604356911"
console.log(resources[0].source_call_number);    // "HB3595 .K53 1988"
console.log(resources[0].resource_data.copiedItem); // { full data }
```

### Test 3: Duplicate Previous Course
```typescript
// 1. Click "Duplicate Previous Course" button
// 2. System fetches previous course resources
// 3. System maps to CourseItems with FOLIO metadata
// 4. Verify metadata preserved:
console.log(mappedItems[0].barcode);     // Populated
console.log(mappedItems[0].instanceId);  // Populated
console.log(mappedItems[0].copiedItem);  // Populated
```

## Benefits

✅ **Complete Data Preservation** - No metadata lost during cloning
✅ **Efficient Backend Processing** - Reuse items auto-detected
✅ **Staff Workflow Optimization** - Can skip cataloging for reuse items
✅ **Inventory Linking** - Direct connection to FOLIO holdings
✅ **Backward Compatible** - Still sends original `items` array
✅ **Future-Proof** - `resource_data` JSON can store additional fields

## Next Steps

1. ✅ **Test with Real Data** - Use production FOLIO API
2. ✅ **Verify Backend Processing** - Check `submission_new_resources` table
3. ✅ **Staff Dashboard Updates** - Use reuse flags for workflow
4. ✅ **Analytics** - Track reuse vs new item ratios
5. ✅ **Batch Processing** - Bulk handle reuse items

---

**The system now fully supports physical item reuse with complete FOLIO metadata!** 🚀
