import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Copy, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface PreviousCourse {
  id: string;
  courseCode: string;
  courseTitle: string;
  term: string;
  section: string;
  totalItems: number;
}

// Mock previous courses
const mockPreviousCourses: PreviousCourse[] = [
  {
    id: "prev-1",
    courseCode: "CSC 201",
    courseTitle: "Data Structures",
    term: "Fall 2025",
    section: "01",
    totalItems: 8,
  },
  {
    id: "prev-2",
    courseCode: "CSC 201",
    courseTitle: "Data Structures",
    term: "Spring 2025",
    section: "02",
    totalItems: 7,
  },
  {
    id: "prev-3",
    courseCode: "ENG 101",
    courseTitle: "Composition I",
    term: "Fall 2025",
    section: "01",
    totalItems: 12,
  },
  {
    id: "prev-4",
    courseCode: "MAT 301",
    courseTitle: "Linear Algebra",
    term: "Fall 2025",
    section: "03",
    totalItems: 5,
  },
  {
    id: "prev-5",
    courseCode: "CSC 301",
    courseTitle: "Algorithms",
    term: "Spring 2025",
    section: "01",
    totalItems: 9,
  },
];

const ClonePrevious = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = mockPreviousCourses.filter((course) => {
    if (searchQuery === "") return true;
    const query = searchQuery.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.courseTitle.toLowerCase().includes(query) ||
      course.term.toLowerCase().includes(query)
    );
  });

  const handleClone = (course: PreviousCourse) => {
    toast.success(`Cloning ${course.courseCode} (${course.term})`);
    navigate("/new-submission");
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
                <h1 className="text-xl font-semibold">Clone from Previous</h1>
                <p className="text-sm text-muted-foreground">Select a course to clone</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search course code, title, or term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Course List */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {course.courseCode}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {course.courseTitle}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Term</span>
                      <Badge variant="secondary">{course.term}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Section</span>
                      <span className="font-medium">{course.section}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">{course.totalItems}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleClone(course)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Clone This Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClonePrevious;
