import { toast } from "sonner";
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import type { CourseItem } from "../store/courseReservesStore";

/**
 * Handlers for drag and drop operations
 */
export const createDragHandlers = (
  reserveId: string,
  items: CourseItem[],
  reorderItems: (id: string, itemIds: string[]) => void,
  addItemToFolder: (id: string, folderId: string, itemId: string) => void,
  hasActiveFiltersOrSort: boolean
) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Only allow drag and drop when using the original order (no sorting/filtering that changes order)
    const isOriginalOrder = !hasActiveFiltersOrSort;

    if (!isOriginalOrder) {
      toast.error("Drag and drop is disabled when filters or sorting are applied. Clear filters to reorder items.");
      return;
    }

  const activeData = active.data.current;
  const overData = over.data.current as { type?: string; folder?: { id: string } } | undefined;

    // Handle dropping an item into a folder (rely on droppable data, not string parsing)
    if (activeData?.type === 'Item' && overData?.type === 'Folder' && overData.folder?.id) {
      const folderId = overData.folder.id;
      const itemId = active.id.toString();

      addItemToFolder(reserveId, folderId, itemId);
      toast.success(`Item moved to folder`);
      return;
    }

    // Handle folder drag and drop (simplified approach)
    if (activeData?.type === 'Folder') {
      // For now, let's disable folder drag and drop to focus on arrow buttons
      toast.info("Use the arrow buttons to reorder folders");
      return;
    }

    // Handle reordering items (existing logic)
    if (activeData?.type === 'Item' && overData?.type === 'Item') {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        reorderItems(reserveId, reorderedItems.map(item => item.id));
        toast.success("Items reordered successfully");
      }
    }
  };

  return { handleDragEnd };
};
