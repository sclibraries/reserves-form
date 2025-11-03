# Individual Resource Selection Feature

## Overview
Faculty can now preview resources from any previous course (exact matches OR all their other courses) and add individual resources one at a time, instead of only being able to clone entire courses.

## User Experience Flow

### 1. Page Load - Smart Detection
- When editor loads, automatically checks if instructor has taught this exact course code before
- Sets `hasExactMatchCourses` boolean based on API results
- No infinite loops (protected by `useRef` guard)

### 2. Clone Banner - Dual Pathways
**When exact matches found (GOV 201 teaching GOV 201):**
```
We found previous versions of GOV 201!
[View GOV 201 History] [Browse All My Courses] [Maybe Later]
```

**When no exact matches (first time teaching, or exploring):**
```
We didn't find previous versions of GOV 201, but you can search all your courses...
[Browse All My Courses] [Maybe Later]
```

### 3. Browse Dialog - Two Modes
**Mode: 'exact'** - Shows only courses matching current course code
**Mode: 'all'** - Shows ALL courses taught by instructor

Each course card shows:
- Course code and title
- Term and instructor
- Resource count (electronic + physical estimate)
- Two buttons: **[Preview]** and **[Add All]** (or **[Copy All]**)

### 4. Preview Dialog - Individual Selection
When clicking [Preview] on any course:
- Fetches physical reserves (books, chapters) from FOLIO API
- Fetches electronic resources (articles, videos) from course reserves API
- Displays unified list with material type badges
- Each resource shows:
  - Title, author, publication info
  - Material type (Book, Article, Chapter, Video, etc.)
  - Link to resource (if electronic)
  - Call number (if physical)
  - Notes
- Each resource has an **[Add]** button

### 5. Adding Resources
**Individual Add:**
- Click [Add] next to any resource in preview
- Resource is immediately added to current course
- Toast confirmation shown
- Preview dialog stays open (can add more from same course)

**Bulk Add:**
- Click [Add All] or [Copy All] from course card
- All resources from that course are added at once
- Uses existing full-clone logic

### 6. Multi-Course Workflow
- Banner remains visible after adding materials
- Can open dialog again, switch modes, preview different courses
- Can add materials from GOV 201 (Spring 2024), GOV 234 (Fall 2023), GOV 301 (Spring 2023), etc.
- Material count shows: "(current count + new count)"

## Technical Implementation

### New State Variables
```typescript
const [viewMode, setViewMode] = useState<'exact' | 'all'>('exact');
const [previewCourse, setPreviewCourse] = useState<PreviousCourse | null>(null);
const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
const [loadingPreview, setLoadingPreview] = useState(false);
const [previewResources, setPreviewResources] = useState<PreviewResource[]>([]);
```

### New TypeScript Interfaces
```typescript
interface PreviousCourse {
  courseListingId: string;
  courseNumber: string;
  courseName: string;
  term: string;
  instructor: string;
  resourceCount: number;
  isExactMatch?: boolean;
}

interface PreviewResource {
  type: 'physical' | 'electronic';
  title: string;
  author?: string;
  materialType: string;
  url?: string;
  publicationInfo?: string;
  callNumber?: string;
  notes?: string;
  _originalReserve?: PhysicalReserve;
  _originalResource?: ElectronicResource;
}
```

### Key Functions

#### `handleOpenCloneDialog(mode: 'exact' | 'all')`
- Takes mode parameter to switch between exact matches and all courses
- Queries API based on mode
- Opens dialog with appropriate course list

#### `handlePreviewCourse(course: PreviousCourse)`
- Fetches physical reserves from: `libtools2.smith.edu/folio/web/search/search-course-listings`
- Fetches electronic resources from: `libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources`
- Transforms data into unified `PreviewResource` format
- Stores original data in `_originalReserve` and `_originalResource` properties for later cloning
- Opens preview dialog with resource list

#### `handleAddSingleResource(resource: PreviewResource)`
- Takes single resource from preview
- Extracts original API data from `_originalReserve` or `_originalResource`
- Transforms to `CourseItem` format matching existing data structure
- Calls `addItem()` to add to current course
- Shows success toast
- Does NOT close preview dialog (allows multiple additions)

### API Integration

**Search Courses:**
```
GET https://libtools2.smith.edu/folio/web/search/search-courses
Query params:
  - query: "(instructors.name==\"Smith, Jane\")" for all courses
  - query: "(instructors.name==\"Smith, Jane\" and courseNumber==\"GOV 201*\")" for exact matches
```

**Physical Reserves:**
```
GET https://libtools2.smith.edu/folio/web/search/search-course-listings?courseListingId={id}
Returns: Array of reserves with item details, contributors, call numbers
```

**Electronic Resources:**
```
GET https://libtools2.smith.edu/course-reserves/backend/web/course/get-merged-resources?courseListingId={id}
Returns: { resources: [...] } with titles, URLs, authors, publication info
```

### CORS Handling
- All GET requests use **Accept header only** (no Content-Type to avoid preflight)
- Gracefully handles CORS errors with try/catch
- Shows friendly messages when resources can't be loaded

## UI Components

### Clone Banner
- Background: Blue gradient (from-blue-50 to-blue-100)
- Persistent after cloning
- Icon: Copy/FileText based on mode
- Responsive button layout

### Clone Dialog
- Max width: 4xl
- Max height: 80vh with scrollable content
- Sections for "Exact Matches" (green) and "Other Courses" (blue)
- Resource count badges
- Dual-button layout per course

### Preview Dialog
- Similar layout to clone dialog
- Resource count summary banner at top
- Material type badges (Electronic/Physical + specific type)
- Clickable URLs for electronic resources
- Metadata displayed clearly (author, publication info, call number)
- Add buttons aligned to right

## Example Scenario

**Faculty: Jane Smith teaching GOV 201 in Spring 2025**

1. Opens submission editor for GOV 201
2. Page loads → API checks → finds GOV 201 taught in Fall 2024, Spring 2024
3. Banner shows: "We found previous versions of GOV 201!"
4. Two buttons visible: "View GOV 201 History" and "Browse All My Courses"

**Option A: Focus on exact matches**
- Clicks "View GOV 201 History"
- Sees GOV 201 Fall 2024 (with 12 electronic resources), GOV 201 Spring 2024 (with 8 electronic resources)
- Clicks [Preview] on Fall 2024
- Sees list of 12 articles + 3 books
- Clicks [Add] on 5 favorite articles
- Closes preview
- Clicks [Add All] on Spring 2024 to get all 8 from that term
- Total: 5 individual + 8 bulk = 13 materials added

**Option B: Explore all courses**
- Clicks "Browse All My Courses"
- Sees GOV 201 (exact matches at top) + GOV 234, GOV 301, GOV 401
- Clicks [Preview] on GOV 234 (related topic from different course)
- Sees 15 resources, adds 3 relevant ones
- Clicks [Preview] on GOV 301
- Sees 20 resources, adds 2 more
- Banner still visible, could continue browsing
- Total: 5 materials from related courses

## Testing Checklist

- [ ] Page load detection works (exact matches found/not found)
- [ ] Banner shows correct buttons based on detection
- [ ] "View History" button opens dialog in 'exact' mode
- [ ] "Browse All" button opens dialog in 'all' mode
- [ ] Preview button fetches and displays resources
- [ ] Individual [Add] buttons work for each resource type
- [ ] Physical resources (books) transform correctly
- [ ] Electronic resources (articles) transform correctly
- [ ] [Add All] still works for full course clone
- [ ] Preview dialog stays open after adding individual items
- [ ] Banner persists after adding materials
- [ ] Material count updates correctly
- [ ] Toast notifications appear on success
- [ ] CORS errors handled gracefully
- [ ] Multiple courses can be used in same session

## Future Enhancements

### Possible Improvements:
1. **Bulk selection in preview** - Checkboxes to select multiple resources before adding
2. **Search/filter in preview** - Filter resources by type, author, title
3. **Resource comparison** - Highlight duplicates if resource already exists in current course
4. **Preview while editing** - Side-by-side comparison of old course and new course
5. **Smart recommendations** - ML-based suggestions of most relevant resources to add
6. **Drag-and-drop** - Drag resources from preview directly into folder structure
7. **Resource metadata editing** - Edit title/author before adding
8. **Notes transfer** - Include instructor notes from previous course

## Known Limitations

1. **Resource count is electronic only** - Physical count not available from API endpoint (would require separate call per course)
2. **No deduplication** - System doesn't check if resource already exists before adding
3. **TypeScript warnings** - Some `any` types remain in nested API response handling (doesn't affect functionality)
4. **No undo** - Once added, must manually delete to remove (could add undo toast action)

## Files Modified

- **src/pages/SubmissionEditor.tsx** - Main implementation (banner, dialogs, logic)
- Added TypeScript interfaces for API responses
- Added state management for preview system
- Added event handlers for preview and individual add
- Updated clone dialog UI with Preview buttons
- Created new preview dialog component

## Dependencies

- React hooks: useState, useEffect, useRef
- Zustand stores: courseReservesStore, authStore, courseSearchStore
- shadcn/ui components: Dialog, Button, Badge, Card, ScrollArea
- Lucide icons: Copy, FileText, AlertCircle, Plus, ExternalLink, User, CheckCircle2
- Sonner toast notifications
