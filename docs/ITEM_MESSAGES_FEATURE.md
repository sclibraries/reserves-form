# Item-Specific Messages Feature

## Overview

The "Notes" column in the items table now has functional message buttons that allow faculty to send messages to library staff about specific items. This creates a direct communication channel for questions, issues, or notes related to individual materials.

## What Was Implemented

### 1. New Component: `ItemMessageDialog`

**Location:** `src/components/Communications/ItemMessageDialog.tsx`

A specialized message dialog that:
- ✅ Opens when clicking the message icon next to an item
- ✅ Pre-fills the subject with the item title
- ✅ Links the message to the specific resource via `resource_id`
- ✅ Allows selection of category (Question, Issue, Update, Note)
- ✅ Allows selection of priority (Low, Normal, High, Urgent)
- ✅ Shows the item title in the dialog description
- ✅ Stops click propagation to prevent row selection

**Props:**
```typescript
interface Props {
  itemTitle: string;       // Display name of the item
  itemId: string;          // Internal item ID
  resourceId?: number;     // Backend resource ID for linking
  onSubmit: (data: CreateMessageRequest) => Promise<void>;
  trigger?: React.ReactNode; // Optional custom trigger
}
```

### 2. Updated `SubmissionDetail.tsx`

**Changes:**
- Added `CommunicationsAPI` instance
- Added `handleItemMessage()` function to send messages
- Replaced static `MessageSquare` icon with interactive `ItemMessageDialog`
- Added toast notifications for success/failure
- Removed `cursor-pointer` from table rows (no longer needed)

**Message Handler:**
```typescript
const handleItemMessage = async (data: CreateMessageRequest) => {
  if (!id) return;
  
  try {
    await api.createMessage(id, data);
    toast.success('Message sent to library staff');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
    toast.error(errorMessage);
    throw err;
  }
};
```

### 3. Updated Exports

Added `ItemMessageDialog` to `src/components/Communications/index.ts` for easy importing.

## User Flow

### Sending a Message About an Item

1. User views submission detail page
2. Sees items table with "Notes" column
3. Clicks message icon (💬) next to specific item
4. Dialog opens with:
   - **Title:** "Send Message About Item"
   - **Description:** Shows the item title
   - **Subject:** Pre-filled with "Question about: [Item Title]"
   - **Category:** Defaults to "Question"
   - **Priority:** Defaults to "Normal"
   - **Message:** Empty textarea (required)
5. User edits subject (optional)
6. User selects category and priority
7. User types message
8. User clicks "Send Message"
9. Dialog closes
10. Toast notification confirms success
11. Message appears in communications section with link to the item

### Viewing Item-Specific Messages

Messages sent about specific items:
- Appear in the Communications section at bottom of page
- Show "📎 Related to Item #123" indicator
- Can be replied to and managed like any other message
- Staff can see which exact item the message refers to

## UI/UX Features

### Message Button
- Ghost button with hover effect
- Small icon (4x4) to fit in table cell
- Muted color by default, primary on hover
- Click stops event propagation (doesn't select row)

### Dialog
- Same styling as `MessageComposer`
- Clear indication which item the message is about
- Pre-filled subject for convenience
- Helper text reminds user the message is linked to the item
- Loading state while sending
- Validation requires message text

### Toast Notifications
- ✅ Success: "Message sent to library staff" (green)
- ❌ Error: Shows specific error message (red)

## Data Flow

```
User clicks message icon
    ↓
ItemMessageDialog opens
    ↓
User fills form and submits
    ↓
handleItemMessage(data)
    ↓
CommunicationsAPI.createMessage(uuid, {
  ...data,
  resource_id: 123  // Links to specific item
})
    ↓
POST to backend with resource_id
    ↓
Success response
    ↓
Toast notification
    ↓
Dialog closes
    ↓
Message appears in communications list
```

## Technical Details

### Resource ID Extraction
```typescript
resourceId={parseInt(item.id.replace('material-', ''))}
```
Converts item IDs like "material-123" to numeric resource ID `123` for the backend.

### Pre-filled Subject
```typescript
subject: `Question about: ${itemTitle}`
```
Automatically creates a contextual subject line that staff can immediately understand.

### Click Event Handling
```typescript
onClick={(e) => e.stopPropagation()}
```
Prevents the table row click event when opening the dialog.

### Form State
```typescript
const [formData, setFormData] = useState<CreateMessageRequest>({
  message: '',
  subject: `Question about: ${itemTitle}`,
  category: 'question',
  priority: 'normal',
  resource_id: resourceId,
});
```

## Integration with Communications System

### Linked Messages
Messages created via `ItemMessageDialog` include `resource_id`, which:
- Links the message to the specific material in the backend
- Displays "📎 Related to Item #123" in `MessageCard`
- Helps staff identify exactly which item needs attention
- Allows filtering/searching by resource in the future

### Same API Endpoint
Uses the same `CommunicationsAPI.createMessage()` method as general messages, ensuring consistency.

### Appears in Main Feed
Item-specific messages appear in the communications section alongside general messages, with clear visual indication of the linked resource.

## Benefits

✅ **Contextual Communication** - Messages directly tied to specific items
✅ **Better Organization** - Staff knows exactly which item has a question/issue
✅ **Faster Resolution** - No confusion about which material is being discussed
✅ **Improved UX** - One click from item to message dialog
✅ **Consistent Interface** - Uses same styling and patterns as general messages
✅ **Easy Discovery** - Message icon visible next to every item

## Example Use Cases

1. **Missing Information**: "What edition of this textbook should I get?"
2. **Alternative Request**: "If this book is unavailable, can we use the 2nd edition?"
3. **Urgent Need**: "Students need this article by Monday for assignment"
4. **Clarification**: "Should this be physical or electronic access?"
5. **Status Check**: "Any update on when this will be available?"

## Testing Checklist

- [x] Click message icon opens dialog
- [x] Subject pre-filled with item title
- [x] Category and priority selectable
- [x] Message submission works
- [x] Toast notifications display
- [x] Dialog closes on success
- [x] resource_id sent to backend
- [x] Message appears in communications list
- [x] Resource link shows in message card
- [x] Click doesn't trigger row selection
- [x] Form validation works
- [x] Loading state displays
- [x] Error handling works

## Future Enhancements

- 📊 Filter messages by specific item
- 🔔 Notification badge on items with unread messages
- 📈 Count of messages per item
- 🔗 Click resource link to scroll to item in table
- 📎 Show message count in Notes column
- 🎯 Quick reply from item row

---

**Implemented**: October 2025  
**Status**: ✅ Complete and Functional  
**Related**: Communications Feature, SubmissionDetail Page
