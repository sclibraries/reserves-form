# Communications Component Architecture

## Component Hierarchy

```
SubmissionDetail (Page)
└── Card
    └── CardContent
        └── CommunicationsContainer
            ├── Header Section
            │   ├── Title with Unread Badge
            │   └── MessageComposer (Dialog Button)
            │       └── Dialog
            │           └── Form (Subject, Category, Priority, Message)
            │
            ├── MessageFilters
            │   ├── Priority Dropdown
            │   ├── Status Dropdown
            │   ├── Category Dropdown
            │   └── Clear Filters Button
            │
            └── MessageList
                └── MessageCard (Multiple)
                    ├── Header
                    │   ├── Category Icon
                    │   ├── Subject + NEW Badge
                    │   ├── Sender Info + Timestamp
                    │   ├── Priority Badge
                    │   └── Status Badge
                    │
                    ├── Message Body (Expandable)
                    │
                    ├── Resource Link (if applicable)
                    │
                    ├── Replies Section (when expanded)
                    │   └── Reply Cards
                    │       ├── Reply Message
                    │       └── Reply Metadata
                    │
                    ├── Action Buttons (when expanded)
                    │   ├── Reply Button
                    │   └── Mark as Resolved Button
                    │
                    └── ReplyForm (when active)
                        ├── Textarea
                        └── Cancel + Send Buttons
```

## Data Flow

### Loading Messages
```
CommunicationsContainer (mount)
    ↓
useEffect triggers
    ↓
loadMessages() called
    ↓
CommunicationsAPI.getMessages(uuid)
    ↓
fetch with JWT headers
    ↓
Backend returns Message[]
    ↓
setMessages(data)
    ↓
MessageList renders MessageCards
```

### Creating a Message
```
User clicks "New Message"
    ↓
MessageComposer Dialog opens
    ↓
User fills form and clicks "Send"
    ↓
handleCreateMessage(data)
    ↓
CommunicationsAPI.createMessage(uuid, data)
    ↓
POST request to backend
    ↓
Success response
    ↓
loadMessages() to refresh
    ↓
New message appears in list
```

### Replying to a Message
```
User expands MessageCard
    ↓
User clicks "Reply"
    ↓
ReplyForm appears inline
    ↓
User types and clicks "Send Reply"
    ↓
handleReply(text)
    ↓
onReply({ message: text, parent_message_id })
    ↓
CommunicationsAPI.createMessage(uuid, data)
    ↓
POST request with parent_message_id
    ↓
Success response
    ↓
loadMessages() to refresh
    ↓
Reply appears in message.replies[]
```

### Marking as Read
```
User clicks on MessageCard
    ↓
handleCardClick()
    ↓
if (!message.is_read) onMarkAsRead(messageId)
    ↓
CommunicationsAPI.markAsRead(uuid, messageId)
    ↓
POST request to /read endpoint
    ↓
Optimistic UI update:
setMessages(prev => prev.map(...))
    ↓
Unread badge disappears
Blue border removed
```

### Filtering Messages
```
User selects filter option
    ↓
onFilterChange({ ...filter, key: value })
    ↓
setFilter(newFilter)
    ↓
filteredMessages computed:
messages.filter(msg => match filters)
    ↓
MessageList renders filtered results
```

### Auto-Refresh (Polling)
```
useEffect setInterval(loadMessages, 30000)
    ↓
Every 30 seconds:
    ↓
loadMessages()
    ↓
Fetch latest messages
    ↓
Update UI if changes detected
    ↓
New messages appear
Unread count updates
```

## State Management

### CommunicationsContainer State
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [filter, setFilter] = useState<{
  priority?: string;
  status?: string;
  category?: string;
}>({});
```

### MessageCard State
```typescript
const [showReplyForm, setShowReplyForm] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
```

### MessageComposer State
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<CreateMessageRequest>({
  message: '',
  subject: '',
  category: 'question',
  priority: 'normal',
});
const [sending, setSending] = useState(false);
```

### ReplyForm State
```typescript
const [message, setMessage] = useState('');
const [sending, setSending] = useState(false);
```

## Props Flow

```
SubmissionDetail
    submissionUuid={id!}
        ↓
CommunicationsContainer
    submissionUuid
    ↓
    ├── MessageList
    │   messages, onMarkAsRead, onReply, onResolve
    │       ↓
    │       MessageCard (each message)
    │       message, onMarkAsRead, onReply, onResolve
    │           ↓
    │           ReplyForm
    │           onSubmit, onCancel
    │
    ├── MessageComposer
    │   onSubmit, submissionUuid
    │
    └── MessageFilters
        filter, onFilterChange
```

## API Client Methods

```typescript
class CommunicationsAPI {
  // GET - Fetch all messages
  async getMessages(submissionUuid: string): Promise<Message[]>
  
  // POST - Create message or reply
  async createMessage(
    submissionUuid: string, 
    data: CreateMessageRequest
  ): Promise<Response>
  
  // PUT - Update message
  async updateMessage(
    submissionUuid: string, 
    messageId: number, 
    data: UpdateMessageRequest
  ): Promise<Response>
  
  // DELETE - Archive message
  async deleteMessage(
    submissionUuid: string, 
    messageId: number
  ): Promise<Response>
  
  // POST - Mark as read
  async markAsRead(
    submissionUuid: string, 
    messageId: number
  ): Promise<Response>
}
```

## Event Handlers

### CommunicationsContainer
- `loadMessages()` - Fetch messages from API
- `handleCreateMessage(data)` - Create new message
- `handleMarkAsRead(messageId)` - Mark message as read
- `handleUpdateMessage(messageId, status)` - Update message status

### MessageCard
- `handleCardClick()` - Expand/collapse, mark as read
- `handleReply(replyText)` - Send reply

### MessageComposer
- `handleSubmit(e)` - Submit new message form

### ReplyForm
- `handleSubmit(e)` - Submit reply form

## CSS Classes (Tailwind)

### Message States
- Unread: `border-l-4 border-l-blue-500 bg-blue-50/50`
- Resolved: `opacity-70`
- Expanded: Full content visible
- Collapsed: `line-clamp-2` on message body

### Priority Colors
- Low: `bg-gray-100 text-gray-800 border-gray-200`
- Normal: `bg-blue-100 text-blue-800 border-blue-200`
- High: `bg-orange-100 text-orange-800 border-orange-200`
- Urgent: `bg-red-100 text-red-800 border-red-200`

### Status Colors
- Active: `variant="default"`
- Resolved: `variant="secondary"`

### Interactive Elements
- Hover: `hover:bg-muted/50`
- Cursor: `cursor-pointer`
- Transitions: `transition-all`

---

This architecture provides a scalable, maintainable, and user-friendly communications system fully integrated with the backend API.
