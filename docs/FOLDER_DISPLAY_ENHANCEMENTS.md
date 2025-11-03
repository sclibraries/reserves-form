# Folder Display Enhancements

## Overview
Enhanced the visual presentation of folders in the submission detail view to clearly differentiate them from regular items and show proper position numbering.

## Changes Made

### 1. Display Order Fix (`submissionHandlers.ts`)
**Problem**: Items were being assigned incorrect `display_order` values, and folders were getting fractional positions like `.5`.

**Solution**: Implemented a proper position mapping system that:
- Assigns clean sequential positions (0, 1, 2, 3...) based on the visual order
- All items in a folder share the folder's `display_order`
- Items within folders get a separate `position_in_folder` (0, 1, 2...)

**Example Structure**:
```
Position 0: Item A (ungrouped)
Position 1: Item B (ungrouped)
Position 2: Folder "Week 1"
            ├─ Item C (display_order: 2, position_in_folder: 0)
            ├─ Item D (display_order: 2, position_in_folder: 1)
            └─ Item E (display_order: 2, position_in_folder: 2)
Position 3: Item F (ungrouped)
```

### 2. Visual Styling (`SubmissionDetail.tsx`)

#### Folder Header Styling
- **Background**: Light blue (`bg-blue-50`) in light mode, dark blue (`dark:bg-blue-950`) in dark mode
- **Border**: Thicker blue border on top (`border-t-2 border-blue-200`)
- **Icon**: Larger folder icon (5x5) with blue fill
- **Text**: Blue text color for better contrast
- **Badge**: Shows item count with blue styling
- **Hover**: Slightly darker blue on hover

#### Items Within Folders
- **Background**: Subtle blue tint (`bg-blue-50/30`) to indicate folder membership
- **Left Border**: Bold blue left border (`border-l-4 border-l-blue-300`) for visual hierarchy
- **Indentation**: Position numbers are indented with left padding
- **Position Format**: Shows nested numbering (e.g., `2.1`, `2.2`, `2.3`)

#### Ungrouped Items
- Standard white/default background
- Sequential position numbers (1, 2, 3...)
- No special styling

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ 1  │ Item A - Regular item                              │ ← White background
├─────────────────────────────────────────────────────────┤
│ 2  │ Item B - Regular item                              │ ← White background
├═════════════════════════════════════════════════════════┤
│ 3  │ 📁 Week 1 Reading Materials        [3 items]       │ ← Blue header
├─────────────────────────────────────────────────────────┤
┃ 3.1│ Item C - In folder                                 │ ← Blue tint + left border
├─────────────────────────────────────────────────────────┤
┃ 3.2│ Item D - In folder                                 │ ← Blue tint + left border
├─────────────────────────────────────────────────────────┤
┃ 3.3│ Item E - In folder                                 │ ← Blue tint + left border
├─────────────────────────────────────────────────────────┤
│ 4  │ Item F - Regular item                              │ ← White background
└─────────────────────────────────────────────────────────┘
```

## Benefits

1. **Clear Visual Differentiation**: Folders stand out immediately with blue styling
2. **Hierarchical Numbering**: Position numbers show both global position and folder position
3. **Better Organization**: Left border and background tint clearly show folder membership
4. **Dark Mode Support**: All colors have dark mode variants for consistency
5. **Accessibility**: Strong color contrast and clear visual indicators
6. **Backend Compatibility**: Clean data structure for easy sorting and filtering

## Backend Data Structure

```json
{
  "displayOrder": [
    { "type": "item", "id": "item-1", "displayPosition": 0 },
    { "type": "item", "id": "item-2", "displayPosition": 1 },
    { "type": "folder", "id": "folder-1", "displayPosition": 2 },
    { "type": "item", "id": "item-6", "displayPosition": 3 }
  ],
  "folders": [
    {
      "id": "folder-1",
      "name": "Week 1",
      "display_order": 2,
      "items": [
        {
          "id": "item-3",
          "title": "Item C",
          "display_order": 2,
          "position_in_folder": 0
        },
        {
          "id": "item-4",
          "title": "Item D",
          "display_order": 2,
          "position_in_folder": 1
        }
      ]
    }
  ]
}
```

## Testing Checklist

- [x] Folders show blue styling
- [x] Folder position numbers display correctly (1, 2, 3...)
- [x] Items within folders show nested numbering (3.1, 3.2, 3.3...)
- [x] Left border appears on folder items
- [x] Blue background tint visible on folder items
- [x] Dark mode colors work correctly
- [x] Backend receives correct display_order values
- [x] Backend receives correct position_in_folder values
- [x] No more fractional positions (.5) in submission data
