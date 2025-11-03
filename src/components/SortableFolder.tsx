import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  FolderClosed,
  Edit2, 
  Trash2, 
  Plus,
  Check,
  X,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { SortableItem } from './SortableItem';
import type { CourseFolder, CourseItem } from "../store/courseReservesStore";

interface SortableFolderProps {
  folder: CourseFolder;
  index: number;
  totalFolders: number;
  onEditItem: (item: CourseItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateFolder: (folderId: string, updates: Partial<Pick<CourseFolder, 'title' | 'description' | 'isOpen'>>) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onRemoveItemFromFolder: (itemId: string) => void;
  onMoveItemInFolder?: (folderId: string, itemId: string, direction: 'up' | 'down') => void;
  onMoveFolderUp?: () => void;
  onMoveFolderDown?: () => void;
  isDragDisabled?: boolean;
}

export const SortableFolder = ({ 
  folder,
  index,
  totalFolders,
  onEditItem,
  onDeleteItem,
  onUpdateFolder,
  onDeleteFolder,
  onToggleFolder,
  onRemoveItemFromFolder,
  onMoveItemInFolder,
  onMoveFolderUp,
  onMoveFolderDown,
  isDragDisabled = false
}: SortableFolderProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: folder.id,
    disabled: isDragDisabled,
    data: {
      type: 'Folder',
      folder,
    }
  });

  // Make folder a drop zone for items
  const { 
    setNodeRef: setDroppableRef, 
    isOver: isDropOver 
  } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'Folder',
      folder,
    }
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(folder.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle !== folder.title) {
      onUpdateFolder(folder.id, { title: editingTitle.trim() });
    } else {
      setEditingTitle(folder.title);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditingTitle(folder.title);
    setIsEditingTitle(false);
  };

  const handleToggle = () => {
    onToggleFolder(folder.id);
  };

  // Combine the sortable and droppable refs
  const combineRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <Card
      ref={combineRefs}
      style={style}
      className={`group relative border-l-4 border-l-blue-500 ${
        isDragging 
          ? 'shadow-lg ring-2 ring-primary' 
          : isDropOver 
            ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50' 
            : 'hover:shadow-md'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Position indicator and drag handle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Position number */}
            <div className="bg-blue-500/10 text-blue-600 text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center">
              {index + 1}
            </div>
            
            {/* Drag handle */}
            <button
              {...attributes}
              {...(!isDragDisabled ? listeners : {})}
              className={`p-1 transition-colors ${
                isDragDisabled 
                  ? 'cursor-not-allowed text-muted-foreground/50' 
                  : 'cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground'
              }`}
              disabled={isDragDisabled}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Folder toggle and icon */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 flex-1 min-w-0 hover:bg-muted/50 rounded p-1 -m-1"
          >
            {folder.isOpen ? (
              <>
                <ChevronDown className="h-4 w-4 text-blue-600" />
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 text-blue-600" />
                <FolderClosed className="h-5 w-5 text-blue-600" />
              </>
            )}
            
            {/* Folder title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="h-6 text-sm font-medium"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  onBlur={handleSaveTitle}
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSaveTitle}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="font-medium text-sm flex-1 text-left truncate">
                {folder.title} ({folder.items.length} items)
              </span>
            )}
          </button>

          {/* Action buttons */}
          <div className="flex gap-1">
            {/* Move folder up/down buttons */}
            {onMoveFolderUp && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveFolderUp();
                }}
                title="Move folder up"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
            )}
            {onMoveFolderDown && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveFolderDown();
                }}
                title="Move folder down"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            )}
            
            {/* Edit title button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Edit folder name"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            
            {/* Delete folder button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.title}" and move all items out of the folder?`)) {
                  onDeleteFolder(folder.id);
                }
              }}
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Folder contents */}
      {folder.isOpen && (
        <CardContent className="pt-0">
          {folder.items.length > 0 ? (
            <div className="space-y-2 ml-4 border-l border-muted pl-4">
              {folder.items.map((item, itemIndex) => (
                <div key={item.id} className="relative">
                  <SortableItem
                    item={item}
                    index={itemIndex}
                    totalItems={folder.items.length}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onMoveUp={itemIndex > 0 && onMoveItemInFolder ? () => onMoveItemInFolder(folder.id, item.id, 'up') : undefined}
                    onMoveDown={itemIndex < folder.items.length - 1 && onMoveItemInFolder ? () => onMoveItemInFolder(folder.id, item.id, 'down') : undefined}
                    isDragDisabled={true} // Items in folders can't be dragged individually
                    availableFolders={[]} // No folder management for items already in folders
                    onRemoveFromFolder={onRemoveItemFromFolder}
                  />
                  {/* Remove from folder button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 hover:opacity-100 focus:opacity-100 bg-background/80 hover:bg-background"
                    onClick={() => onRemoveItemFromFolder(item.id)}
                    title="Remove from folder"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="ml-4 p-4 border border-dashed border-muted rounded-lg text-center text-sm text-muted-foreground">
              No items in this folder yet. Drag items here or use the folder actions.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};