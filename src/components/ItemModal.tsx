import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ItemData {
  id?: string;
  materialType: string;
  title: string;
  author: string;
  citation: string;
  sourceLink: string;
  requestType: string;
  neededBy?: Date;
  publicNote: string;
  // Material-specific fields
  isbn?: string;
  doi?: string;
  pages?: string;
  edition?: string;
  publisher?: string;
  publicationYear?: string;
  journal?: string;
  volume?: string;
  issue?: string;
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: ItemData) => void;
  initialData?: ItemData;
}

export const ItemModal = ({ open, onOpenChange, onSave, initialData }: ItemModalProps) => {
  const [formData, setFormData] = useState<ItemData>({
    materialType: "",
    title: "",
    author: "",
    citation: "",
    sourceLink: "",
    requestType: "link-electronic", // Default to most common
    publicNote: "",
    isbn: "",
    doi: "",
    pages: "",
    edition: "",
    publisher: "",
    publicationYear: "",
    journal: "",
    volume: "",
    issue: "",
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        materialType: initialData.materialType || "",
        title: initialData.title || "",
        author: initialData.author || "",
        citation: initialData.citation || "",
        sourceLink: initialData.sourceLink || "",
        requestType: initialData.requestType || "link-electronic",
        publicNote: initialData.publicNote || "",
        neededBy: initialData.neededBy,
        isbn: initialData.isbn || "",
        doi: initialData.doi || "",
        pages: initialData.pages || "",
        edition: initialData.edition || "",
        publisher: initialData.publisher || "",
        publicationYear: initialData.publicationYear || "",
        journal: initialData.journal || "",
        volume: initialData.volume || "",
        issue: initialData.issue || "",
      });
    } else {
      setFormData({
        materialType: "",
        title: "",
        author: "",
        citation: "",
        sourceLink: "",
        requestType: "link-electronic",
        publicNote: "",
        isbn: "",
        doi: "",
        pages: "",
        edition: "",
        publisher: "",
        publicationYear: "",
        journal: "",
        volume: "",
        issue: "",
      });
    }
  }, [initialData, open]); // Also depend on open to reset when modal opens

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.materialType) {
      toast.error("Please select a material type");
      return;
    }


    onSave(formData);
    onOpenChange(false);
    toast.success("Item saved successfully");
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-140px)] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="materialType">
                  Material Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.materialType}
                  onValueChange={(value) => setFormData({ ...formData, materialType: value })}
                >
                  <SelectTrigger id="materialType">
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Book">Book</SelectItem>
                    <SelectItem value="Book Chapter">Book Chapter</SelectItem>
                    <SelectItem value="Journal Article">Journal Article</SelectItem>
                    <SelectItem value="Article">Article</SelectItem>
                    <SelectItem value="Research Paper">Research Paper</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Video Lecture">Video Lecture</SelectItem>
                    <SelectItem value="Streaming Video">Streaming Video</SelectItem>
                    <SelectItem value="DVD Digitization">DVD Digitization</SelectItem>
                    <SelectItem value="Website">Website/Web Page</SelectItem>
                    <SelectItem value="Problem Set">Problem Set</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author/Creator</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Enter author or creator name"
                />
              </div>

              {/* Material-specific fields */}
              {formData.materialType === "Book" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn || ""}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edition">Edition</Label>
                      <Input
                        id="edition"
                        value={formData.edition || ""}
                        onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                        placeholder="e.g., 4th"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="publisher">Publisher</Label>
                      <Input
                        id="publisher"
                        value={formData.publisher || ""}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        placeholder="Publisher name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publicationYear">Year</Label>
                      <Input
                        id="publicationYear"
                        value={formData.publicationYear || ""}
                        onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.materialType === "Book Chapter" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pages">Chapter/Pages</Label>
                    <Input
                      id="pages"
                      value={formData.pages || ""}
                      onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                      placeholder="e.g., Chapter 3, pp. 45-67"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn || ""}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edition">Edition</Label>
                      <Input
                        id="edition"
                        value={formData.edition || ""}
                        onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                        placeholder="e.g., 4th"
                      />
                    </div>
                  </div>
                </>
              )}

              {(formData.materialType === "Journal Article" || formData.materialType === "Article" || formData.materialType === "Research Paper") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="journal">Journal Name</Label>
                    <Input
                      id="journal"
                      value={formData.journal || ""}
                      onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                      placeholder="Journal name"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="volume">Volume</Label>
                      <Input
                        id="volume"
                        value={formData.volume || ""}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        placeholder="Vol. 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue">Issue</Label>
                      <Input
                        id="issue"
                        value={formData.issue || ""}
                        onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                        placeholder="No. 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publicationYear">Year</Label>
                      <Input
                        id="publicationYear"
                        value={formData.publicationYear || ""}
                        onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doi">DOI</Label>
                    <Input
                      id="doi"
                      value={formData.doi || ""}
                      onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                      placeholder="10.1000/182"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Additional Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="sourceLink">Source Link/URL</Label>
                <Input
                  id="sourceLink"
                  type="url"
                  value={formData.sourceLink}
                  onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citation">Full Citation</Label>
                <Textarea
                  id="citation"
                  value={formData.citation}
                  onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                  placeholder="Paste or enter the full citation here"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Needed By Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.neededBy && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.neededBy ? format(formData.neededBy, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.neededBy}
                      onSelect={(date) => setFormData({ ...formData, neededBy: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="publicNote">Notes for Library Staff</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Textarea
                  id="publicNote"
                  value={formData.publicNote}
                  onChange={(e) => setFormData({ ...formData, publicNote: e.target.value })}
                  placeholder="Add any special instructions, preferences, or clarifications"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>File Upload (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload syllabus excerpt or citation file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or image • Max 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
