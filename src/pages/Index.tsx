import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubmissionCard, Submission } from "@/components/SubmissionCard";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Search, BookOpen } from "lucide-react";

// Mock data
const mockSubmissions: Submission[] = [
  {
    id: "1",
    courseCode: "CSC 201",
    courseTitle: "Data Structures",
    term: "Spring 2026",
    status: "draft",
    totalItems: 7,
    completeItems: 3,
    inProgressItems: 2,
    needsReviewItems: 2,
    lastUpdated: "Aug 12, 2026",
  },
  {
    id: "2",
    courseCode: "MAT 301",
    courseTitle: "Linear Algebra",
    term: "Spring 2026",
    status: "submitted",
    totalItems: 5,
    completeItems: 2,
    inProgressItems: 3,
    needsReviewItems: 0,
    lastUpdated: "Aug 10, 2026",
  },
  {
    id: "3",
    courseCode: "ENG 101",
    courseTitle: "Composition I",
    term: "Fall 2025",
    status: "complete",
    totalItems: 12,
    completeItems: 12,
    inProgressItems: 0,
    needsReviewItems: 0,
    lastUpdated: "Dec 15, 2025",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const statuses = ["Draft", "Submitted", "In Review", "Partially Complete", "Complete", "Canceled"];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filteredSubmissions = mockSubmissions.filter((sub) => {
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.some((s) => s.toLowerCase().replace(" ", "-") === sub.status);
    const matchesSearch =
      searchQuery === "" ||
      sub.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Course Reserves</h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              Spring 2026
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold">My Submissions</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/new-submission")}>
              <Plus className="mr-2 h-4 w-4" />
              New Submission
            </Button>
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Clone from Previous
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Badge
                key={status}
                variant={selectedStatuses.includes(status) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={() => toggleStatus(status)}
              >
                {status}
              </Badge>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search course code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Submissions Grid */}
        {filteredSubmissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No submissions yet for this term</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first course reserve submission
            </p>
            <Button size="lg" onClick={() => navigate("/new-submission")}>
              <Plus className="mr-2 h-5 w-5" />
              Start a Submission
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
