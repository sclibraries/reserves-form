import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ItemModal } from "@/components/ItemModal";
import { SortableItem } from "@/components/SortableItem";
import { SortableFolder } from "@/components/SortableFolder";
import { CourseModal } from "@/components/CourseModal";
import { ItemSortingToolbar } from "@/components/ItemSortingToolbar";
import { ArrowLeft, Plus, Copy, Trash2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

// Custom hooks
import { useSubmissionEditor } from "@/hooks/useSubmissionEditor";
import { usePreviousCourseDetection } from "@/hooks/usePreviousCourseDetection";
import { useCourseCloning } from "@/hooks/useCourseCloning";
import type { PhysicalReserve, ElectronicResource } from "@/hooks/useCourseCloning";
import type { CourseItem, FolioLocation, FolioCopiedItem } from "@/store/courseReservesStore";
import { useOrganizedContent, useFilteredAndSortedContent } from "@/hooks/useContentOrganization";

// Components
import { CloneSuggestionBanner } from "@/components/CloneSuggestionBanner";
import { CourseDetailsPanel } from "@/components/CourseDetailsPanel";
import { InstructionsSection } from "@/components/InstructionsSection";
import { EmptyState } from "@/components/EmptyState";
import { CloneDialog } from "@/components/CloneDialog";

// Handlers
import { createItemHandlers } from "@/handlers/itemHandlers";
import { createFolderHandlers, createCourseHandlers } from "@/handlers/folderHandlers";
import { createDragHandlers } from "@/handlers/dragHandlers";
import { createSubmissionHandlers } from "@/handlers/submissionHandlers";
import { createCloneResourceHandler } from "@/handlers/cloneResourceHandler";

const SubmissionEditor = () => {
  const navigate = useNavigate();
  
  // Main state and actions
  const {
    id,
    reserve,
    user,
    modalOpen,
    setModalOpen,
    editingItem,
    setEditingItem,
    showSubmitDialog,
    setShowSubmitDialog,
    emailConfirmation,
    setEmailConfirmation,
    courseModalOpen,
    setCourseModalOpen,
    showInstructions,
    setShowInstructions,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters,
    hasActiveFiltersOrSort,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    moveItemToPosition,
    updateReserve,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolder,
    addItemToFolder,
    removeItemFromFolder,
    moveItemInFolder,
    moveFolderPosition,
  } = useSubmissionEditor();

  // Previous course detection
  const {
    showCloneSuggestion,
    setShowCloneSuggestion,
    hasExactMatchCourses,
    checkingForPreviousCourses,
  } = usePreviousCourseDetection(
    id,
    reserve?.courseCode,
    reserve?.items.length || 0,
    reserve?.folders.length || 0,
    user?.full_name
  );

  // Clone dialog state
  const [cloneDialogOpen, setCloneDialogOpen] = React.useState(false);
  const [cloneDialogMode, setCloneDialogMode] = React.useState<'exact' | 'all'>('exact');
  const [cloneDialogDirectToResources, setCloneDialogDirectToResources] = React.useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [duplicateSubmitting, setDuplicateSubmitting] = React.useState(false);
  const [duplicateSourceCourse, setDuplicateSourceCourse] = React.useState<{
    term: string;
    courseName: string;
    resourceCount: number;
    electronicCount: number;
    physicalCount: number;
  } | null>(null);
  const [loadingDuplicateSource, setLoadingDuplicateSource] = React.useState(false);

  // Cloning helpers for duplicate flow
  const { fetchPreviousCourses, fetchCourseResources } = useCourseCloning();

  // Content organization
  const organizedContent = useOrganizedContent(reserve);
  const filteredAndSortedContent = useFilteredAndSortedContent(
    organizedContent,
    searchQuery,
    filters,
    sortBy
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate total displayed items
  const totalDisplayedItems = filteredAndSortedContent.folders.reduce(
    (acc, folder) => acc + folder.items.length, 
    0
  ) + filteredAndSortedContent.ungroupedItems.length;

  // Not found state
  if (!reserve) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Reserve Not Found</h1>
          <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Detect if we're editing an existing submission vs creating a new one
  const isEditingSubmission = reserve.status === 'submitted';

  // Create handlers
  const itemHandlers = createItemHandlers(
    id!,
    addItem,
    updateItem,
    deleteItem,
    moveItemToPosition,
    updateReserve,
    reserve.items,
    hasActiveFiltersOrSort,
    setEditingItem,
    setModalOpen
  );

  const folderHandlers = createFolderHandlers(
    id!,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolder
  );

  const courseHandlers = createCourseHandlers(
    id!,
    updateReserve,
    setCourseModalOpen
  );

  const dragHandlers = createDragHandlers(
    id!,
    reserve.items,
    reorderItems,
    addItemToFolder,
    hasActiveFiltersOrSort
  );

  const submissionHandlers = createSubmissionHandlers(
    navigate,
    reserve,
    organizedContent,
    setShowSubmitDialog
  );

  const cloneResourceHandler = createCloneResourceHandler(
    reserve,
    id,
    addItem
  );

  const handleOpenCloneDialog = (mode: 'exact' | 'all' = 'exact', directToResources: boolean = false) => {
    setCloneDialogMode(mode);
    setCloneDialogDirectToResources(directToResources);
    setCloneDialogOpen(true);
  };

  const handleOpenDuplicateDialog = async () => {
    if (!reserve?.courseCode || !user?.full_name) {
      setShowDuplicateDialog(true);
      return;
    }

    setLoadingDuplicateSource(true);
    try {
      const courses = await fetchPreviousCourses(reserve.courseCode, user.full_name, 'exact');
      if (courses && courses.length > 0) {
        const source = courses[0];
        setDuplicateSourceCourse({
          term: source.term,
          courseName: source.courseName,
          resourceCount: source.resourceCount,
          electronicCount: source.electronicCount,
          physicalCount: source.physicalCount,
        });
      } else {
        setDuplicateSourceCourse(null);
      }
    } catch (error) {
      console.error('Failed to fetch previous course:', error);
      setDuplicateSourceCourse(null);
    } finally {
      setLoadingDuplicateSource(false);
      setShowDuplicateDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">My Course Reserves /</span>
                  <span className="font-semibold">{reserve.courseCode} ({reserve.term})</span>
                  {isEditingSubmission && (
                    <Badge variant="secondary" className="ml-2">
                      Editing Submission
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="draft" />
              <Button variant="ghost" onClick={submissionHandlers.handleSaveDraft}>
                Save Draft
              </Button>
              {/* Duplicate previous course quick-submit button - only show when creating new submission */}
              {!isEditingSubmission && (
                <Button
                  variant="secondary"
                  className="bg-amber-500/90 hover:bg-amber-500 text-white"
                  onClick={handleOpenDuplicateDialog}
                  disabled={loadingDuplicateSource}
                  title="Submit indicating you're reusing all previous materials"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {loadingDuplicateSource ? 'Loading...' : 'Duplicate Previous Course'}
                </Button>
              )}
              <Button onClick={submissionHandlers.handleSubmit}>
                {isEditingSubmission ? 'Update Submission' : 'Submit to Library'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Left: Course Panel */}
          <div className="space-y-4">
            <CourseDetailsPanel 
              reserve={reserve} 
              onEdit={courseHandlers.handleEditCourse}
            />
          </div>

          {/* Right: Items List */}
          <div className="space-y-6">
            {/* Clone Suggestion Banner - only show when creating new submission */}
            {!isEditingSubmission && showCloneSuggestion && !checkingForPreviousCourses && (
              <CloneSuggestionBanner
                hasExactMatchCourses={hasExactMatchCourses}
                checkingForPreviousCourses={checkingForPreviousCourses}
                itemsLength={reserve.items.length}
                courseCode={reserve.courseCode}
                onViewExact={() => handleOpenCloneDialog('exact', true)}
                onBrowseAll={() => handleOpenCloneDialog('all', false)}
                onDismiss={() => setShowCloneSuggestion(false)}
              />
            )}
            
            {/* Instructions */}
            <InstructionsSection
              showInstructions={showInstructions}
              onToggle={() => setShowInstructions(!showInstructions)}
            />

            {/* Sorting and Filtering Toolbar */}
            <ItemSortingToolbar
              totalItems={reserve.items.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
            />

            {/* Add Item Button */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {(reserve.items.length > 0 || reserve.folders.length > 0) && (
                  <Button 
                    variant="outline" 
                    onClick={() => itemHandlers.handleClearAll(reserve.items.length, reserve.folders.length)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All ({reserve.items.length}{reserve.folders.length > 0 ? ` + ${reserve.folders.length} folders` : ''})
                  </Button>
                )}
                {!showCloneSuggestion && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowCloneSuggestion(true)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy from Previous Courses
                  </Button>
                )}
              </div>
              <Button onClick={itemHandlers.handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>

            {/* Items List or Empty State */}
            {totalDisplayedItems === 0 ? (
              <EmptyState
                hasItems={reserve.items.length > 0}
                hasFolders={reserve.folders.length > 0}
                onAddItem={itemHandlers.handleAddItem}
                onCreateFolder={folderHandlers.handleCreateFolder}
                onClearFilters={resetFilters}
              />
            ) : (
              <div className="space-y-4">
                {/* Create Folder Button */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {filteredAndSortedContent.folders.length} folders, {filteredAndSortedContent.ungroupedItems.length} ungrouped items
                  </span>
                  <Button variant="outline" size="sm" onClick={folderHandlers.handleCreateFolder}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Folder
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={dragHandlers.handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                  <SortableContext
                    items={filteredAndSortedContent.mixedContent.map(item => 
                      item.type === 'folder' ? item.folder!.id : item.item!.id
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {filteredAndSortedContent.mixedContent.map((contentItem, index) => {
                        if (contentItem.type === 'folder' && contentItem.folder) {
                          return (
                            <SortableFolder
                              key={contentItem.folder.id}
                              folder={contentItem.folder}
                              index={index}
                              totalFolders={filteredAndSortedContent.folders.length}
                              onEditItem={itemHandlers.handleEditItem}
                              onDeleteItem={itemHandlers.handleDeleteItem}
                              onUpdateFolder={folderHandlers.handleUpdateFolder}
                              onDeleteFolder={folderHandlers.handleDeleteFolder}
                              onToggleFolder={folderHandlers.handleToggleFolder}
                              onRemoveItemFromFolder={(itemId) => removeItemFromFolder(id!, itemId)}
                              onMoveItemInFolder={(folderId, itemId, direction) => 
                                moveItemInFolder(id!, folderId, itemId, direction)
                              }
                              onMoveFolderUp={index > 0 ? 
                                () => moveFolderPosition(id!, contentItem.folder!.id, 'up') : 
                                undefined
                              }
                              onMoveFolderDown={index < filteredAndSortedContent.mixedContent.length - 1 ? 
                                () => moveFolderPosition(id!, contentItem.folder!.id, 'down') : 
                                undefined
                              }
                              isDragDisabled={hasActiveFiltersOrSort}
                            />
                          );
                        } else if (contentItem.type === 'item' && contentItem.item) {
                          return (
                            <SortableItem
                              key={contentItem.item.id}
                              item={contentItem.item}
                              index={index}
                              totalItems={totalDisplayedItems}
                              onEdit={itemHandlers.handleEditItem}
                              onMoveUp={() => itemHandlers.handleMoveUp(contentItem.item!.id)}
                              onMoveDown={() => itemHandlers.handleMoveDown(contentItem.item!.id)}
                              onDelete={itemHandlers.handleDeleteItem}
                              isDragDisabled={hasActiveFiltersOrSort}
                              availableFolders={organizedContent.folders}
                              onAddToFolder={(itemId, folderId) => addItemToFolder(id!, folderId, itemId)}
                              onRemoveFromFolder={(itemId) => removeItemFromFolder(id!, itemId)}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Item Modal */}
      <ItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(itemData) => itemHandlers.handleSaveItem(itemData, editingItem)}
        initialData={editingItem}
      />

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditingSubmission ? 'Update Submission?' : 'Submit to Library?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {isEditingSubmission ? (
                <p>
                  You are updating your submission for {reserve.courseCode} · {reserve.term}. 
                  This will replace the current submission with {reserve.items.length} items 
                  {reserve.folders.length > 0 && ` organized in ${reserve.folders.length} folder${reserve.folders.length > 1 ? 's' : ''}`}.
                </p>
              ) : (
                <>
                  <p>
                    You are submitting {reserve.items.length} items for {reserve.courseCode} · {reserve.term}. You will be able to edit your course until a staff member locks the course for processing.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={emailConfirmation}
                      onCheckedChange={(checked) => setEmailConfirmation(checked as boolean)}
                    />
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email me a confirmation
                    </label>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => submissionHandlers.confirmSubmit(emailConfirmation)}>
              {isEditingSubmission ? 'Update' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Previous Course Submit Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reuse Previous Course Materials?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {duplicateSourceCourse ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Duplicating from:
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>{reserve.courseCode}</strong> · {duplicateSourceCourse.term}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {duplicateSourceCourse.resourceCount > 0 
                      ? `${duplicateSourceCourse.resourceCount} resource${duplicateSourceCourse.resourceCount !== 1 ? 's' : ''} (${duplicateSourceCourse.electronicCount} electronic, ${duplicateSourceCourse.physicalCount} physical)`
                      : 'No resources found'}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    No previous version of <strong>{reserve.courseCode}</strong> found. 
                    Library staff will be notified you want to reuse materials.
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <p>
                  Submitting as <strong>Duplicate Previous Course</strong> tells library staff you are reusing the exact
                  same materials from a prior offering of this course. You do <em>not</em> need to add items here.
                </p>
                <p>
                  If you intend to make any changes or add new materials, cancel and use the standard submission or copy
                  tools instead.
                </p>
                <p className="text-amber-600 font-medium flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  This action submits immediately with a duplicate flag for staff triage.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dup-email"
                  checked={emailConfirmation}
                  onCheckedChange={(checked) => setEmailConfirmation(checked as boolean)}
                />
                <label
                  htmlFor="dup-email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email me a confirmation
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              disabled={duplicateSubmitting}
              onClick={async () => {
                if (!reserve?.courseCode || !user?.full_name) {
                  submissionHandlers.confirmDuplicateSubmit(emailConfirmation);
                  setShowDuplicateDialog(false);
                  return;
                }
                try {
                  setDuplicateSubmitting(true);
                  // 1) Find most recent previous exact-match course for this instructor
                  const courses = await fetchPreviousCourses(reserve.courseCode, user.full_name, 'exact');
                  if (!courses || courses.length === 0) {
                    // Fallback: submit duplicate flag without items
                    submissionHandlers.confirmDuplicateSubmit(emailConfirmation);
                    setShowDuplicateDialog(false);
                    return;
                  }
                  const source = courses[0];
                  if (!source.courseListingId) {
                    submissionHandlers.confirmDuplicateSubmit(emailConfirmation);
                    setShowDuplicateDialog(false);
                    return;
                  }

                  // 2) Fetch resources for that course
                  const { physicalReserves, electronicResources } = await fetchCourseResources(source.courseListingId);

                  // 3) Map to CourseItem[]
                  const mapped: CourseItem[] = [];

                  // Physical reserves -> treat as books with call number/barcode note
                  (physicalReserves || []).forEach((res: PhysicalReserve, idx: number) => {
                    type PhysicalItemInfo = {
                      title?: string;
                      contributors?: Array<{ name: string; primary?: boolean }>;
                      publication?: Array<{ publisher?: string; dateOfPublication?: string }>;
                      callNumber?: string;
                      barcode?: string;
                      copy?: string;
                      instanceId?: string;
                      holdingsId?: string;
                      instanceHrid?: string;
                      temporaryLocationId?: string;
                      temporaryLocationObject?: unknown;
                      permanentLocationId?: string;
                      permanentLocationObject?: unknown;
                      effectiveCallNumberComponents?: { callNumber?: string };
                    };
                    const item = (res.copiedItem || res.item) as PhysicalItemInfo;
                    if (!item?.title) return;
                    const primaryAuthor = item.contributors?.find((c: { primary?: boolean; name?: string }) => c.primary)?.name ||
                      item.contributors?.[0]?.name || '';
                    const pubInfo = item.publication?.[0];
                    let callNumber = '';
                    if (item.callNumber) callNumber = item.callNumber;
                    else if (item.effectiveCallNumberComponents?.callNumber) callNumber = item.effectiveCallNumberComponents.callNumber;
                    const barcode = res.barcode || item.barcode || '';
                    const copy = item.copy || '';
                    
                    mapped.push({
                      id: `item-${Date.now()}-${idx}`,
                      title: item.title,
                      authors: primaryAuthor,
                      materialType: 'book',
                      status: 'draft',
                      publisher: pubInfo?.publisher || '',
                      publicationYear: pubInfo?.dateOfPublication || '',
                      notes: `Call Number: ${callNumber || 'N/A'}${barcode ? ` | Barcode: ${barcode}` : ''}`,
                      
                      // Preserve FOLIO metadata for backend
                      barcode: barcode || undefined,
                      callNumber: callNumber || undefined,
                      copy: copy || undefined,
                      instanceId: item.instanceId || undefined,
                      holdingsId: item.holdingsId || undefined,
                      instanceHrid: item.instanceHrid || undefined,
                      temporaryLocationId: item.temporaryLocationId || undefined,
                      temporaryLocationObject: (item.temporaryLocationObject as FolioLocation) || undefined,
                      permanentLocationId: item.permanentLocationId || undefined,
                      permanentLocationObject: (item.permanentLocationObject as FolioLocation) || undefined,
                      
                      // Preserve full copiedItem data
                      copiedItem: item as FolioCopiedItem,
                    });
                  });

                  // Electronic resources -> infer type by URL/pub title
                  (electronicResources || []).forEach((er: ElectronicResource, idx: number) => {
                    const url = er.url || '';
                    let materialType: 'article' | 'video' | 'website' | 'other' = 'other';
                    if (url.includes('youtube') || url.includes('video')) materialType = 'video';
                    else if (url.includes('ebsco') || url.includes('journal') || !!er.publication_title) materialType = 'article';
                    else if (url) materialType = 'website';
                    const notesParts = [er.notes, er.description, er.external_note, er.internal_note].filter(Boolean);
                    mapped.push({
                      id: `item-${Date.now()}-e${idx}`,
                      title: er.title || er.publication_title || 'Untitled Resource',
                      authors: er.authors || '',
                      url,
                      materialType,
                      status: 'draft',
                      journalTitle: er.publication_title || undefined,
                      publicationYear: er.publication_date || undefined,
                      notes: notesParts.length ? notesParts.join(' ') : undefined,
                    });
                  });

                  // 4) Update the current reserve so the Requested Items panel shows everything
                  updateReserve(id!, { items: mapped });

                  // 5) Submit with duplicate flag and explicit items list to backend
                  submissionHandlers.confirmDuplicateSubmit(emailConfirmation, mapped);
                  setShowDuplicateDialog(false);
                } finally {
                  setDuplicateSubmitting(false);
                }
              }}
            >
              {duplicateSubmitting ? 'Submitting…' : 'Submit as Duplicate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course Edit Modal */}
      <CourseModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        onSave={courseHandlers.handleSaveCourse}
        initialData={{
          courseCode: reserve.courseCode,
          courseTitle: reserve.courseTitle,
          section: reserve.section,
          instructors: reserve.instructors,
          term: reserve.term,
        }}
        isEditing={true}
      />

      {/* Clone Dialog */}
      <CloneDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        reserveId={id!}
        courseCode={reserve.courseCode}
        userName={user?.full_name || ''}
        currentItemsCount={reserve.items.length}
        onAddResource={cloneResourceHandler.handleAddSingleResource}
        initialMode={cloneDialogMode}
        directToResources={cloneDialogDirectToResources}
      />
    </div>
  );
};

export default SubmissionEditor;
