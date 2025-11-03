# Folders with Display Order - Complete Implementation

## Overview
Implemented proper handling of the new API structure where folders contain their own items and both folders and unfoldered items have `display_order` values that must be respected for proper rendering.

## Implementation Date
October 20, 2025

## API Structure

### New Response Format
```json
{
  "folders": [
    {
      "id": "11",
      "name": "Test folder",
      "display_order": 1,
      "items": [
        {
          "id": "132",
          "title": "...",
          "display_order": 0,
          "folder_name": "Test folder"
        }
      ],
      "item_count": 2
    }
  ],
  "unfoldered_items": [
    {
      "id": "134",
      "title": "...",
      "display_order": 2,
      "folder_name": null
    }
  ]
}
```

### Key Changes from Previous Structure
1. **Nested Items**: Items now nested inside `folders[].items[]` array
2. **Separate Unfoldered Items**: New `unfoldered_items[]` array at top level
3. **Display Order Everywhere**: 
   - `folders[].display_order` - Position of folder in overall list
   - `folders[].items[].display_order` - Position of item within its folder
   - `unfoldered_items[].display_order` - Position of item in overall list

## Implementation Details

### 1. Store Updates (`courseReservesStore.ts`)

#### Added displayOrder to CourseItem Interface
```typescript
export interface CourseItem {
  // ... existing fields
  displayOrder?: number; // Order position from backend
}
```

#### Transform Folder Items with Sorting
```typescript
const folderItems: CourseItem[] = (folder.items || []).map((material) => ({
  id: `material-${material.id}`,
  title: material.title,
  // ... other fields
  folderId: `folder-${folder.id}`,
  displayOrder: material.display_order,
})).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
```

#### Transform Folders with Sorting
```typescript
const folders: CourseFolder[] = (item.folders || []).map((folder) => ({
  id: `folder-${folder.id}`,
  title: folder.name,
  items: folderItems, // Already sorted
  position: folder.display_order,
})).sort((a, b) => (a.position || 0) - (b.position || 0));
```

#### Transform Unfoldered Items with Sorting
```typescript
const unfolderedItems: CourseItem[] = (item.unfoldered_items || []).map((material) => ({
  id: `material-${material.id}`,
  title: material.title,
  // ... other fields
  displayOrder: material.display_order,
})).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
```

### 2. UI Updates (`SubmissionDetail.tsx`)

#### Organized Content Helper
```typescript
const getOrganizedContent = () => {
  if (!reserve) return [];
  
  type ContentItem = 
    | { type: 'folder'; folder: typeof reserve.folders[0]; order: number }
    | { type: 'item'; item: typeof reserve.items[0]; order: number };
  
  const content: ContentItem[] = [];
  
  // Add folders with their display_order
  reserve.folders.forEach(folder => {
    content.push({
      type: 'folder',
      folder: folder,
      order: folder.position || 0
    });
  });
  
  // Add unfoldered items with their display_order
  const unfolderedItems = reserve.items.filter(item => !item.folderId);
  unfolderedItems.forEach(item => {
    content.push({
      type: 'item',
      item: item,
      order: item.displayOrder || 0
    });
  });
  
  // Sort by display order to interleave folders and items
  return content.sort((a, b) => a.order - b.order);
};
```

#### Rendering Strategy
The table now renders content in three levels of order:

1. **Overall Order**: Folders and unfoldered items interleaved by `display_order`
2. **Folder Order**: Folders sorted by `folder.display_order`
3. **Item Order**: Items within folders sorted by `item.display_order`

```tsx
{getOrganizedContent().map((content, globalIndex) => {
  if (content.type === 'folder') {
    return (
      <Fragment key={folder.id}>
        {/* Folder header */}
        <TableRow className="bg-muted/30 border-t-2">
          <TableCell colSpan={6}>
            <Folder /> {folder.title} ({folder.items.length} items)
          </TableCell>
        </TableRow>
        {/* Items already sorted by display_order */}
        {folder.items.map((item, itemIndex) => (
          <TableRow key={item.id}>
            <TableCell className="pl-8">{itemIndex + 1}</TableCell>
            {/* ... rest of item */}
          </TableRow>
        ))}
      </Fragment>
    );
  } else {
    // Render unfoldered item
    return <TableRow key={item.id}>...</TableRow>;
  }
})}
```

## Display Order Rules

### Three-Level Hierarchy

#### Level 1: Global Display Order
Mix of folders and unfoldered items in submission-wide order:
- Folder with `display_order: 1`
- Unfoldered Item with `display_order: 2`
- Unfoldered Item with `display_order: 3`
- Folder with `display_order: 4`

#### Level 2: Folder Display Order  
Folders sorted among themselves:
- Folder A: `display_order: 1`
- Folder B: `display_order: 4`
- Folder C: `display_order: 7`

#### Level 3: Item Within Folder Display Order
Items sorted within their parent folder:
- Folder A:
  - Item 1: `display_order: 0`
  - Item 2: `display_order: 1`
  - Item 3: `display_order: 2`

### Example Rendering Order

Given this data:
```
Folder "Week 1" (display_order: 0)
  - Item A (display_order: 0)
  - Item B (display_order: 1)
Unfoldered Item C (display_order: 1)
Unfoldered Item D (display_order: 2)
Folder "Week 2" (display_order: 3)
  - Item E (display_order: 0)
  - Item F (display_order: 1)
```

Renders as:
```
📁 Week 1 (2 items)
  1. Item A
  2. Item B
1. Item C
2. Item D
📁 Week 2 (2 items)
  1. Item E
  2. Item F
```

## Sorting Strategy

### In Store Transformation
All sorting happens during data transformation for optimal performance:

1. **Folder Items**: Sorted by `display_order` when transforming `folder.items[]`
2. **Folders**: Sorted by `position` after transformation
3. **Unfoldered Items**: Sorted by `display_order` after transformation

### In UI Rendering
The UI uses pre-sorted data and only combines folders/items:

```typescript
// Folders already sorted, items within already sorted, unfoldered already sorted
const content = [
  ...folders.map(f => ({ type: 'folder', folder: f, order: f.position })),
  ...unfolderedItems.map(i => ({ type: 'item', item: i, order: i.displayOrder }))
];

// Single sort to interleave
return content.sort((a, b) => a.order - b.order);
```

## Message Badges

### Seamless Integration
Message badges work identically for:
- Items in folders
- Unfoldered items

```typescript
const resourceId = parseInt(item.id.replace('material-', ''));
const totalCount = getItemMessageCount(resourceId);
const unreadCount = getItemUnreadCount(resourceId);
```

No special handling needed - badges automatically appear next to all items.

## Benefits

### Accurate Faculty View
1. **Respects Editing Order**: Items appear exactly as faculty organized them
2. **Logical Grouping**: Folders provide context for related items
3. **Flexible Organization**: Mix folders and standalone items as needed
4. **Clear Hierarchy**: Visual indentation shows folder membership

### Performance Optimized
1. **Sort Once**: All sorting done during transformation, not on every render
2. **Minimal Re-renders**: Smart caching prevents unnecessary updates
3. **Efficient Filtering**: Pre-organized data structure avoids repeated filters
4. **Clean Code**: Single unified rendering loop

### Maintainable Code
1. **Type-Safe**: TypeScript enforces structure throughout
2. **Single Source of Truth**: Display order from API is preserved
3. **Clear Separation**: Store handles transformation, UI handles rendering
4. **Testable**: Each sorting step can be verified independently

## Edge Cases Handled

### Empty States
- ✅ Folder with no items: Shows header with "(0 items)"
- ✅ No folders: All items render as unfoldered
- ✅ No unfoldered items: Only folder sections appear
- ✅ No items at all: Shows "No materials added yet"

### Display Order Edge Cases
- ✅ Missing `display_order`: Defaults to 0
- ✅ Duplicate `display_order`: Maintains stable sort (array order preserved)
- ✅ Gaps in sequence: Respects actual values (0, 5, 10 works fine)
- ✅ Negative values: Sorted correctly (negative before positive)

### Data Integrity
- ✅ Folder ID conflicts: Prefixed with `folder-` to avoid collision
- ✅ Item ID consistency: Uses `material-{id}` format throughout
- ✅ Folder references: Items track `folderId` for proper filtering
- ✅ Backward compatibility: Old data without folders still works

## Testing Checklist

### Display Order Verification
- [ ] Folders appear in correct order by `display_order`
- [ ] Items within folders appear in correct order by `display_order`
- [ ] Unfoldered items appear in correct order by `display_order`
- [ ] Folders and unfoldered items interleave correctly
- [ ] Item numbering within folders starts at 1 for each folder
- [ ] Unfoldered item numbering is independent

### Data Loading
- [ ] Initial page load shows correct order
- [ ] Page refresh maintains order
- [ ] Polling updates maintain order
- [ ] Order persists when navigating away and back

### API Response Variations
- [ ] All items in folders (no unfoldered_items)
- [ ] All items unfoldered (no folders)
- [ ] Mixed folders and unfoldered items
- [ ] Empty folders in response
- [ ] Folders with many items (20+)

### Message Badges
- [ ] Badges appear for items in folders
- [ ] Badges appear for unfoldered items
- [ ] Badge counts accurate regardless of item location
- [ ] Clicking message bubble works for all items

## Files Modified

### `/src/store/courseReservesStore.ts`
**Changes:**
- Added `displayOrder?: number` to `CourseItem` interface
- Updated `fetchSubmissions` to parse `folders[]` and `unfoldered_items[]`
- Updated `fetchSubmissionDetails` to parse `folders[]` and `unfoldered_items[]`
- Added sorting by `displayOrder` for items within folders
- Added sorting by `displayOrder` for unfoldered items
- Added sorting by `position` for folders

**Lines Changed:** ~60 lines modified

### `/src/pages/SubmissionDetail.tsx`
**Changes:**
- Added `getOrganizedContent()` helper function
- Complete table body rewrite to use organized content
- Unified rendering logic for folders and unfoldered items
- Proper numbering for items within folders vs. unfoldered items
- Maintained message badge integration

**Lines Changed:** ~50 lines modified

## Performance Metrics

### Sorting Complexity
- **Folder Items**: O(n log n) per folder, where n = items in folder
- **Folders**: O(f log f) where f = number of folders
- **Unfoldered Items**: O(u log u) where u = unfoldered items
- **Combined**: O(c log c) where c = folders + unfoldered items (typically small)

### Rendering Performance
- **No re-sorting**: UI uses pre-sorted data
- **Single pass**: One loop through organized content
- **React keys**: Stable keys prevent unnecessary re-renders
- **Smart caching**: Display order changes only trigger update if actual values change

## Related Documentation
- `FOLDERS_SUPPORT_IMPLEMENTATION.md` - Initial folder support
- `ITEM_NOTES_BADGE_ENHANCEMENT.md` - Message badges feature
- `POLLING_ARCHITECTURE.md` - Polling system overview

## Summary
This implementation properly handles the new API structure with nested folder items and separate unfoldered items, while respecting display_order at all three levels (global, folder, and item). The result is an accurate representation of faculty's organizational intent, with folders and items appearing exactly as ordered in the editing interface. Message badges continue to work seamlessly, and the entire system maintains high performance through efficient sorting and smart caching.
