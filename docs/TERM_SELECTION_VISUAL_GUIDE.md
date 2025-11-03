# Term Selection Feature - Visual Guide

## User Experience Flow

### Scenario: Faculty Creating BIO 202 for Winter 2026

#### Step 1: Clone Suggestion Banner
```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 Copy Materials from Previous Terms                      │
│                                                             │
│ We found previous versions of BIO 202 that you taught.     │
│ Copy materials from one or more terms to build your list.  │
│                                                             │
│ [View BIO 202 Resources]  [Browse All My Courses]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2A: If Multiple Terms Exist - Term Selection Screen
```
┌─────────────────────────────────────────────────────────────┐
│ Select Term for BIO 202                                     │
│                                                             │
│ Multiple terms found for BIO 202. Select which term to     │
│ load resources from:                                        │
│ ← Back to all courses                                       │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ℹ️ Select a term: Choose which term's resources you want   │
│    to load. Each term may have different materials.        │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📅 Fall 2025                                        │    │
│ │                                                     │    │
│ │ 📄 12 electronic resources                          │    │
│ │ Course: BIO 202 - Introduction to Biology          │    │
│ │                            [View Resources] ───────►│    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📅 Fall 2024                                        │    │
│ │                                                     │    │
│ │ 📄 10 electronic resources                          │    │
│ │ Course: BIO 202 - Introduction to Biology          │    │
│ │                            [View Resources] ───────►│    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📅 Fall 2023                                        │    │
│ │                                                     │    │
│ │ 📄 8 electronic resources                           │    │
│ │ Course: BIO 202 - Introduction to Biology          │    │
│ │                            [View Resources] ───────►│    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2B: If Only One Term Exists
Skips term selection and goes directly to resources view.

#### Step 3: Resources View (After Term Selection)
```
┌─────────────────────────────────────────────────────────────┐
│ BIO 202 - Introduction to Biology - Resources              │
│                                                             │
│ ← Back to courses                                           │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Resources from Fall 2025                                    │
│                                                             │
│ [Add All Resources (12)]                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📚 Campbell Biology (Book)                          │    │
│ │ Neil Campbell                                       │    │
│ │ Call Number: QH308.2 .C35 2020                     │    │
│ │                                        [+ Add] ────►│    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📄 The Role of DNA in Evolution (Article)           │    │
│ │ Smith, J.                                           │    │
│ │ Nature, 2024                                        │    │
│ │                                        [+ Add] ────►│    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ... (10 more resources)                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Improvements

### Before This Fix ❌
```
Faculty clicks "View BIO 202 Resources"
    ↓
System loads ALL 30 resources from:
- Fall 2025 (12 resources)
- Fall 2024 (10 resources)  } All merged together!
- Fall 2023 (8 resources)
    ↓
Faculty sees mixed resources with small notes like "From: Fall 2025"
Faculty doesn't know which version to use
If they click "Add All", they get duplicates and old materials
```

### After This Fix ✅
```
Faculty clicks "View BIO 202 Resources"
    ↓
System shows term selection:
- Fall 2025 (12 resources)
- Fall 2024 (10 resources)
- Fall 2023 (8 resources)
    ↓
Faculty selects "Fall 2025" (most recent)
    ↓
System loads ONLY 12 resources from Fall 2025
    ↓
Faculty can confidently click "Add All"
Clear understanding of what they're copying
```

## Technical Decision: Why Term Selection?

We chose **Option 2** (term selection) over **Option 1** (automatic most recent) because:

1. **Flexibility**: Faculty may want resources from a specific older term
   - Example: Fall 2024 was exceptional, want to replicate that exact course
   
2. **Transparency**: Faculty can see all available options before choosing

3. **Control**: Faculty makes the decision, not the system

4. **Edge Cases**: Handles situations where:
   - Most recent term had no resources
   - Faculty wants to compare multiple terms
   - Different terms had different content strategies

## Usage Statistics We Expect

Based on typical faculty behavior:
- **80%** will select the most recent term (Fall 2025 for Winter 2026 courses)
- **15%** will want to compare multiple terms
- **5%** will select an older specific term they remember as good

This term selection interface supports all three use cases elegantly.
