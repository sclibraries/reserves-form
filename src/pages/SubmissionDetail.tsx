import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, MessageSquare, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";

const mockItems = [
  {
    id: "1",
    position: 1,
    title: "Introduction to Algorithms",
    materialType: "Book",
    requestType: "Link owned electronic",
    status: "complete",
    neededBy: "Jan 15, 2026",
  },
  {
    id: "2",
    position: 2,
    title: "Data Structures Chapter 4",
    materialType: "Chapter",
    requestType: "Digitize",
    status: "in-review",
    neededBy: "Jan 20, 2026",
  },
  {
    id: "3",
    position: 3,
    title: "Algorithm Analysis",
    materialType: "Article",
    requestType: "Link owned physical",
    status: "submitted",
    neededBy: "Jan 25, 2026",
  },
];

const mockNotes = [
  {
    id: "1",
    author: "Library Staff",
    initials: "LS",
    content: "We've located the electronic version of Introduction to Algorithms. Link will be ready by tomorrow.",
    timestamp: "Aug 12, 2026 at 2:30 PM",
    isStaff: true,
  },
  {
    id: "2",
    author: "Dr. Smith",
    initials: "DS",
    content: "Thank you! Please let me know if you need the specific page numbers for Chapter 4.",
    timestamp: "Aug 12, 2026 at 3:15 PM",
    isStaff: false,
  },
];

const mockUpdates = [
  "Aug 12 · Staff set 'Complete' on 'Introduction to Algorithms'",
  "Aug 11 · Staff set 'In Review' on 'Data Structures Chapter 4'",
  "Aug 10 · Submission created",
];

const SubmissionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newNote, setNewNote] = useState("");

  const handleSendNote = () => {
    if (newNote.trim()) {
      toast.success("Note sent to library staff");
      setNewNote("");
    }
  };

  const completedItems = mockItems.filter((item) => item.status === "complete").length;
  const progressPercent = (completedItems / mockItems.length) * 100;

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
            <StatusBadge status="in-review" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Bar */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">CSC 201 · Data Structures</h2>
                <Badge variant="secondary">Spring 2026</Badge>
              </div>
              <StatusBadge status="in-review" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Item Progress</span>
                <span className="font-medium">
                  {completedItems}/{mockItems.length} complete
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">FOLIO Linkage</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">Not linked to FOLIO</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Requested Items</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Material Type</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Needed By</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockItems.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{item.position}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.materialType}</TableCell>
                      <TableCell>{item.requestType}</TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={item.status as any} 
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell>{item.neededBy}</TableCell>
                      <TableCell className="text-center">
                        <MessageSquare className="h-4 w-4 inline text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="conversation">
              <TabsList className="mb-4">
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="space-y-4">
                {mockNotes.length > 0 ? (
                  <div className="space-y-4">
                    {mockNotes.map((note) => (
                      <div key={note.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={note.isStaff ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                            {note.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm">{note.author}</span>
                            <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No notes yet. Use notes to clarify editions, pages, or streaming preferences.
                  </p>
                )}

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note for library staff..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSendNote} disabled={!newNote.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Note
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="updates" className="space-y-2">
                {mockUpdates.map((update, index) => (
                  <div
                    key={index}
                    className="text-sm py-2 px-3 rounded-lg bg-muted/50"
                  >
                    {update}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmissionDetail;
