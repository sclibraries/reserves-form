import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionCard, Submission } from "@/components/SubmissionCard";
import { CourseModal, CourseData } from "@/components/CourseModal";
import { TermsDebugPanel } from "@/components/TermsDebugPanel";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";
import DebugOnly from "@/components/DebugOnly";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Search, BookOpen, Settings } from "lucide-react";
import { useCourseReservesStore } from "../store/courseReservesStore";
import { useTermsStore } from "../store/termsStore";
import { useAuthStore } from "../store/authStore";

const Index = () => {
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  
  // Use Zustand stores
  const { reserves, addReserve, deleteReserve, getReserveStats, initialize, fetchSubmissions, startPolling, stopPolling, loading: reservesLoading } = useCourseReservesStore();
  const { 
    getCurrentTermName, 
    getNextTermName, 
    fetchTerms, 
    refreshTermsIfStale, 
    loading: termsLoading,
    error: termsError 
  } = useTermsStore();
  const { user, isAuthenticated, initializeFromCookie } = useAuthStore();

  // Debug terms loading
  useEffect(() => {
    console.log('Terms loading:', termsLoading);
    console.log('Terms error:', termsError);
    console.log('Current term name:', getCurrentTermName());
    console.log('Next term name:', getNextTermName());
  }, [termsLoading, termsError, getCurrentTermName, getNextTermName]);

  // Initialize stores on first load
  useEffect(() => {
    initialize();
    refreshTermsIfStale();
    initializeFromCookie();
  }, [initialize, refreshTermsIfStale, initializeFromCookie]);

  // Fetch submissions from backend when authenticated and start polling
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, fetching submissions...');
      fetchSubmissions();
      
      // Start polling for real-time updates (every 30 seconds)
      startPolling(30000);
      
      // Cleanup: stop polling when component unmounts or user logs out
      return () => {
        stopPolling();
      };
    }
  }, [isAuthenticated, user, fetchSubmissions, startPolling, stopPolling]);

  const statuses = ["Draft", "Partially Complete", "Submitted", "Complete"];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleCreateCourse = (courseData: CourseData) => {
    const reserveId = addReserve({
      courseCode: courseData.courseCode,
      courseTitle: courseData.courseTitle,
      section: courseData.section,
      instructors: courseData.instructors,
      term: courseData.term,
      status: "draft",
      items: [],
      folders: [] // Add folders property as required by CourseReserve
    });
    
    // Navigate to the editor for the new course
    navigate(`/submission/${reserveId}/edit`);
  };

  const handleDeleteCourse = (reserveId: string) => {
    deleteReserve(reserveId);
  };

  // Convert CourseReserve to Submission format for display
  const submissions: Submission[] = reserves.map((reserve) => {
    const stats = getReserveStats(reserve.id);
    
    // Map store status to submission status
    const statusMapping = {
      'draft': 'draft' as const,
      'in-progress': 'partial' as const,
      'submitted': 'submitted' as const,
      'complete': 'complete' as const
    };
    
    return {
      id: reserve.id,
      courseCode: reserve.courseCode,
      courseTitle: reserve.courseTitle,
      term: reserve.term,
      status: statusMapping[reserve.status],
      totalItems: stats.totalItems,
      completeItems: stats.completeItems,
      inProgressItems: stats.inProgressItems,
      needsReviewItems: stats.needsReviewItems,
      lastUpdated: reserve.lastUpdated,
    };
  });

  const filteredSubmissions = submissions.filter((sub) => {
    const statusFilterMapping = {
      'Draft': 'draft',
      'Partially Complete': 'partial', 
      'Submitted': 'submitted',
      'Complete': 'complete'
    };
    
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.some((s) => statusFilterMapping[s as keyof typeof statusFilterMapping] === sub.status);
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
              {isAuthenticated && user && (
                <Badge variant="outline" className="text-xs">
                  {user.full_name}
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-sm">
              {getNextTermName()}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Panels - hidden in production builds by default */}
        <DebugOnly>
        <div className="space-y-4 mb-6">
          <AuthDebugPanel />
          {/* <TermsDebugPanel /> */}
          
          {/* Clone Matching Test Link */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">🧪 Clone Matching Test</h3>
                  <p className="text-sm text-amber-700">
                    Test the course matching algorithm for cloning materials from previous terms
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/clone-matching-test")}
                  className="border-amber-300 hover:bg-amber-100"
                >
                  Open Test Interface
                </Button>
              </div>
            </CardContent>
          </Card>
  </div>
  </DebugOnly>
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold">My Course Reserves</h2>
          <div className="flex flex-wrap gap-2">
                              <Button onClick={() => setCourseModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Course
        </Button>
            <Button variant="outline" onClick={() => navigate("/clone-previous")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy from Previous Term
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
              <SubmissionCard 
                key={submission.id} 
                submission={submission} 
                onDelete={submission.status === 'draft' ? handleDeleteCourse : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet for {getNextTermName()}</h3>
            <p className="text-muted-foreground mb-6">
              Create your first course and add reading materials for the library to process
            </p>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => setCourseModalOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create New Course
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/clone-previous")}>
                <Copy className="mr-2 h-5 w-5" />
                Copy from Previous Term
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <CourseModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        onSave={handleCreateCourse}
      />
    </div>
  );
};

export default Index;
