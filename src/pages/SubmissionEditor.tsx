import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ItemDrawer, ItemData } from "@/components/ItemDrawer";
import { ArrowLeft, Plus, GripVertical, Edit2, FileText, Link, Calendar } from "lucide-react";
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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const SubmissionEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [items, setItems] = useState<(ItemData & { id: string })[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(ItemData & { id: string }) | undefined>();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(false);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setDrawerOpen(true);
  };

  const handleEditItem = (item: ItemData & { id: string }) => {
    setEditingItem(item);
    setDrawerOpen(true);
  };

  const handleSaveItem = (itemData: ItemData) => {
    if (editingItem) {
      setItems(items.map((item) => (item.id === editingItem.id ? { ...itemData, id: editingItem.id } : item)));
    } else {
      const newItem = { ...itemData, id: Date.now().toString() };
      setItems([...items, newItem]);
    }
  };

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    toast.success("Submitted. Library staff will begin review.");
    navigate(`/submission/${id}`);
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved");
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
                  <span className="text-sm text-muted-foreground">My Submissions /</span>
                  <span className="font-semibold">CSC 201 (Spring 2026)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="draft" />
              <Button variant="ghost" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handleSubmit}>Submit to Library</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Left: Course Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold">Course Details</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Course Code</p>
                  <p className="font-medium">CSC 201</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course Title</p>
                  <p className="font-medium">Data Structures</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">01</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <Badge variant="secondary">Spring 2026</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FOLIO Linkage</p>
                  <p className="text-sm">Not linked to FOLIO</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Needed By Date</p>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Pick a date
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Requested Items</h3>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No items yet. Add your first reading, video, or chapter.
                  </p>
                  <Button onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{item.title}</h4>
                          {item.author && (
                            <p className="text-sm text-muted-foreground">{item.author}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status="draft" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Item Drawer */}
      <ItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit to Library?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                You are submitting {items.length} items for CSC 201 · Spring 2026. You won't be
                able to edit items after submission, but you can add notes.
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubmissionEditor;
