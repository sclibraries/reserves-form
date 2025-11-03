import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

interface EmptyStateProps {
  hasItems: boolean;
  hasFolders: boolean;
  onAddItem: () => void;
  onCreateFolder: () => void;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasItems,
  hasFolders,
  onAddItem,
  onCreateFolder,
  onClearFilters,
}) => {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          {!hasItems && !hasFolders ? (
            <>
              <p className="text-muted-foreground mb-4">
                No materials yet. Add your first book, article, or chapter, or create a folder to organize them.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
                <Button variant="outline" onClick={onCreateFolder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Folder
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                No materials match your current filters.
              </p>
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
