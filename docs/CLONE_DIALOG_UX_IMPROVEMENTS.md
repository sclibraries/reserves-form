# Clone Dialog UX Improvements

## Summary of Changes

This update significantly improves the course cloning experience by addressing several UI/UX issues and adding better resource information display.

## Issues Addressed

### 1. Resource Count Accuracy
**Problem:** Only electronic resource counts were shown, with vague "may have physical books" messaging.

**Solution:** 
- Now fetches and counts both electronic AND physical resources from `get-merged-resources`
- Displays total accurate count: "15 resources (electronic and physical)"
- Updated all UI components to show combined counts

### 2. Terminology Consistency
**Problem:** Used "book" terminology which is inaccurate - physical items can be many things.

**Solution:**
- Changed all references from "book" to "physical resource"
- Updated badges and labels: "Physical Resource" instead of "book"
- More accurate terminology throughout the UI

### 3. Confusing Navigation
**Problem:** After viewing term-specific courses, clicking "Back to courses" showed a confusing list mixing exact matches and other courses with no way to return to term selection.

**Solution:**
- Simplified navigation flow:
  - Initial view: "View [COURSE] Resources" → Term Selection (if multiple terms) → Resources
  - "Back to courses" now goes back to the full course list
  - Term selection screen accessible when clicking from clone banner
- Clear navigation path with no dead ends

### 4. Resource Display Order
**Problem:** Resources from `get-merged-resources` have an `order` field that was being ignored, causing items to display out of sequence.

**Solution:**
- Added `order` field to `PreviewResource` interface
- Parse and preserve order from API response
- Sort resources by order before display (ascending)
- Electronic items with order values display first, then physical items

### 5. Rich Resource Information
**Problem:** Limited information shown for resources, especially physical items lacking catalog links.

**Solution:**

#### Electronic Resources Now Show:
- Title (with HTML formatting preserved in description)
- Resource URL (clickable "View resource")
- Description (with rich text formatting)
- Publication info
- Notes (external_note, internal_note, folder_name)
- Material type badge

#### Physical Resources Now Show:
- Title
- Author (primary contributor)
- Call number
- Barcode
- Copy number
- Publication info (publisher, date)
- **Discovery URL** - Direct link to item in Five Colleges catalog
- Material type: "Physical Resource"

### 6. Discovery URL Generation
**Solution:** Implemented discovery URL generator for physical items:

**Formula:**
```
https://openurl.ebsco.com/c/4e4lys/openurl?
  sid=ebsco:plink&
  id=ebsco:cat09206a:scf.oai.edge.fivecolleges.folio.ebsco.com.fs00001006.{instanceId}&
  crl=f&
  prompt=none
```

**Process:**
1. Extract `instanceId` from physical reserve (UUID format)
2. Convert dashes to dots: `b0bc03ba-d4a1-5667-a6bd-660db5da05da` → `b0bc03ba.d4a1.5667.a6bd.660db5da05da`
3. Insert into URL template with dbid `cat09206a`
4. Display as "View in catalog" link

## Technical Implementation

### Updated Interfaces

**PreviewResource** (`useCourseCloning.ts`):
```typescript
export interface PreviewResource {
  type: 'physical' | 'electronic' | string;
  title: string;
  author?: string;
  materialType: string;
  publicationInfo?: string;
  callNumber?: string;
  url?: string;
  notes?: string;
  order?: number; // NEW
  discoveryUrl?: string; // NEW
  description?: string; // NEW
  _originalReserve?: PhysicalReserve;
  _originalResource?: ElectronicResource;
}
```

**ElectronicResource** (`useCourseCloning.ts`):
```typescript
export interface ElectronicResource {
  id: string;
  title?: string;
  authors?: string;
  url?: string;
  item_url?: string; // NEW - alternative URL field
  publication_title?: string;
  publication_date?: string;
  notes?: string;
  description?: string;
  external_note?: string;
  internal_note?: string;
  folder_name?: string;
  resource_type?: string; // NEW
  order?: string | number; // NEW
}
```

### Key Code Changes

#### 1. useCourseCloning.ts - fetchPreviousCourses()
```typescript
// Now counts both electronic AND physical from merged resources
const resources = electronicData.resources || [];
electronicCount = resources.filter(r => r.resource_type === 'electronic').length;
physicalCount = resources.filter(r => r.resource_type === 'physical').length;
// Return total count
resourceCount: electronicCount + physicalCount
```

#### 2. useCourseCloning.ts - fetchCourseResources()
```typescript
// Fetches merged resources FIRST (includes both types with order)
const mergedRes = await fetch(
  `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/course/get-merged-resources?courseListingId=${courseListingId}`,
  ...
);

// Preserves order from API
electronicResources = resources
  .filter(r => r.resource_type === 'electronic')
  .map(r => ({
    ...r,
    order: r.order ? parseInt(r.order, 10) : 999999,
  }));
```

#### 3. CloneDialog.tsx - handlePreviewCourse()
```typescript
// Create discovery URL helper
const createDiscoveryUrl = (instanceId: string) => {
  const dotFormattedId = instanceId.replace(/-/g, '.');
  const dbid = 'cat09206a';
  return `https://openurl.ebsco.com/c/4e4lys/openurl?sid=ebsco:plink&id=ebsco:${dbid}:scf.oai.edge.fivecolleges.folio.ebsco.com.fs00001006.${dotFormattedId}&crl=f&prompt=none`;
};

// Extract detailed info for physical items
const callNumber = item.callNumber || item.effectiveCallNumberComponents?.callNumber;
const barcode = reserve.barcode || item.barcode;
const copy = item.copy;
const instanceId = item.instanceId;

// Create rich notes
const notesParts = [];
if (callNumber) notesParts.push(`Call Number: ${callNumber}`);
if (barcode) notesParts.push(`Barcode: ${barcode}`);
if (copy) notesParts.push(`Copy: ${copy}`);

// Add discovery URL
discoveryUrl: instanceId ? createDiscoveryUrl(instanceId) : undefined,

// Sort by order
resources.sort((a, b) => (a.order || 999999) - (b.order || 999999));
```

#### 4. ResourcePreviewView.tsx - ResourceCard
```typescript
{/* Physical resource discovery URL */}
{resource.type === 'physical' && resource.discoveryUrl && (
  <div className="flex items-center gap-1 text-blue-600">
    <ExternalLink className="h-3 w-3" />
    <a 
      href={resource.discoveryUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="hover:underline"
    >
      View in catalog
    </a>
  </div>
)}

{/* Description with HTML support */}
{resource.description && (
  <div 
    className="text-muted-foreground text-xs" 
    dangerouslySetInnerHTML={{ __html: resource.description }}
  />
)}
```

## Data Flow

### Resource Counting Flow:
```
fetchPreviousCourses()
  ↓
get-merged-resources API
  ↓
Filter by resource_type
  ├─ electronic → count
  └─ physical → count
  ↓
Total = electronic + physical
  ↓
Display in course cards
```

### Resource Display Flow:
```
handlePreviewCourse()
  ↓
Fetch from two sources:
  ├─ search-course-listings (physical reserves with FOLIO data)
  └─ get-merged-resources (electronic items with order)
  ↓
Process Physical:
  ├─ Extract: title, author, call number, barcode, copy, instanceId
  ├─ Generate discovery URL from instanceId
  └─ Create detailed notes
  ↓
Process Electronic:
  ├─ Extract: title, url/item_url, description, notes
  └─ Preserve order field
  ↓
Sort by order (ascending)
  ↓
Display in ResourcePreviewView
```

## UI Changes

### Before:
```
Course Card:
┌─────────────────────────────┐
│ BIO 202 - Cell Biology      │
│ Fall 2025                   │
│ 5 electronic materials      │ ❌ Incomplete
│ [Preview]                   │
└─────────────────────────────┘

Resource Card:
┌─────────────────────────────┐
│ [book] Energy and the...    │ ❌ Wrong term
│ by Becker                   │
│ Barcode: 123456            │
│ [Add]                       │
└─────────────────────────────┘
```

### After:
```
Course Card:
┌─────────────────────────────┐
│ BIO 202 - Cell Biology      │
│ Fall 2025                   │
│ 15 resources                │ ✅ Complete count
│ [Preview]                   │
└─────────────────────────────┘

Resource Card (Physical):
┌─────────────────────────────┐
│ [Physical Resource]         │ ✅ Correct term
│ Energy and the living cell  │
│ by Becker, Wayne M          │
│ 🔗 View in catalog          │ ✅ NEW: Discovery link
│ Lippincott, [1977]          │
│ Call Number: QH510 .B4      │ ✅ More detail
│ Barcode: 123456 | Copy: 6   │
│ [Add]                       │
└─────────────────────────────┘

Resource Card (Electronic):
┌─────────────────────────────┐
│ [Electronic] [article]      │
│ Eagle, H, 1955 Nutritional..│
│ 🔗 View resource            │
│ JSTOR article               │ ✅ NEW: Description
│ [Add]                       │
└─────────────────────────────┘
```

## Testing Checklist

- [ ] Resource counts show combined electronic + physical totals
- [ ] Terminology changed from "book" to "physical resource" everywhere
- [ ] Navigation: "Back to courses" returns to full course list
- [ ] Resources display in correct order (by `order` field)
- [ ] Electronic resources show description with HTML formatting
- [ ] Physical resources show discovery URLs
- [ ] Discovery URLs open correct catalog page in new tab
- [ ] Physical resource details include: call number, barcode, copy
- [ ] Resource cards display all information properly
- [ ] Sorting works correctly (lower order numbers first)
- [ ] Empty states handle missing data gracefully

## Related Files
- `/src/hooks/useCourseCloning.ts` - Core cloning logic and interfaces
- `/src/components/CloneDialog.tsx` - Main dialog with term selection
- `/src/components/CloneDialog/ResourcePreviewView.tsx` - Resource cards display
- `/src/components/CloneDialog/CourseListView.tsx` - Course list with counts
- `/src/pages/SubmissionEditor.tsx` - Duplicate dialog terminology
