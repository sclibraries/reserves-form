import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCourseSearchStore } from "@/store/courseSearchStore";
import { useCourseReservesStore } from "@/store/courseReservesStore";
import { useTermsStore } from "@/store/termsStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, User, Search, LogOut, LogIn, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { CourseModal, CourseData } from "./CourseModal";

export const AuthDebugPanel = () => {
  const navigate = useNavigate();
  
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading, 
    setMockUser, 
    logout,
    checkTokenExpiration
  } = useAuthStore();

  const {
    courses,
    loading: searchLoading,
    error: searchError,
    searchCoursesByInstructor,
    clearResults,
    totalRecords
  } = useCourseSearchStore();

  const { addReserve } = useCourseReservesStore();
  const { getCurrentTermName, getNextTermName, terms } = useTermsStore();

  const [customName, setCustomName] = useState("");
  const [includeCurrentTermOnly, setIncludeCurrentTermOnly] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [selectedCourseData, setSelectedCourseData] = useState<CourseData | undefined>(undefined);

  const generateUsername = (fullName: string): string => {
    const parts = fullName.trim().toLowerCase().split(/\s+/);
    if (parts.length < 2) return parts[0] || "user";
    
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName.charAt(0)}${lastName}`;
  };

  const handleLogin = async () => {
    if (customName.trim()) {
      setLoginError(null);
      setLoginSuccess(null);
      
      try {
        await setMockUser(customName.trim());
        setLoginSuccess(`Successfully logged in as ${customName.trim()}!`);
        setCustomName(""); // Clear input on success
        
        // Clear success message after 3 seconds
        setTimeout(() => setLoginSuccess(null), 3000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setLoginError(errorMessage);
      }
    }
  };

  const handleSearchUserCourses = async () => {
    if (user?.full_name) {
      let termId = null;
      
      // Only filter by current term if specifically requested
      if (includeCurrentTermOnly) {
        const currentTerm = terms.find(t => t.name === getCurrentTermName());
        termId = currentTerm?.id || null;
      }
      
      await searchCoursesByInstructor(user.full_name, termId);
    }
  };

  const handleQuickCreateCourse = () => {
    if (!user?.full_name) {
      toast.error("Please login first");
      return;
    }

    const nextTerm = getNextTermName();
    const timestamp = Date.now();
    
    // Create a test course with sample data
    const reserveId = addReserve({
      courseCode: `TEST-${timestamp % 1000}`,
      courseTitle: `Test Course ${new Date().toLocaleTimeString()}`,
      section: "01",
      instructors: user.full_name,
      term: nextTerm,
      status: "draft",
      items: [],
      folders: []
    });
    
    toast.success(`Created test course: TEST-${timestamp % 1000}`);
    
    // Navigate to the editor
    navigate(`/submission/${reserveId}/edit`);
  };

  const handleCreateFromSearchResult = (course: {
    courseNumber?: string;
    name?: string;
    courseListingObject?: {
      instructorObjects?: Array<{ name?: string }>;
    };
  }) => {
    const instructorNames = course.courseListingObject?.instructorObjects
      ?.map((i) => i?.name)
      .filter(Boolean)
      .join(", ") || user?.full_name || "";
    
    const courseData: CourseData = {
      courseCode: course.courseNumber || "",
      courseTitle: course.name || "",
      section: "", // Section not provided in search results
      instructors: instructorNames,
      term: getNextTermName(), // Use next term for new course
    };
    
    setSelectedCourseData(courseData);
    setCourseModalOpen(true);
  };

  const handleSaveCourse = (courseData: CourseData) => {
    const reserveId = addReserve({
      courseCode: courseData.courseCode,
      courseTitle: courseData.courseTitle,
      section: courseData.section,
      instructors: courseData.instructors,
      term: courseData.term,
      status: "draft",
      items: [],
      folders: []
    });
    
    toast.success(`Created course: ${courseData.courseCode}`);
    setCourseModalOpen(false);
    
    // Navigate to the editor
    navigate(`/submission/${reserveId}/edit`);
  };

  return (
    <div className="space-y-4">
      {/* Authentication Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authentication Debug
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  checkTokenExpiration();
                }}
              >
                Check Token
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {user.full_name}</div>
                <div><strong>Username:</strong> {user.username}</div>
                <div><strong>Role:</strong> <Badge variant="secondary">{user.role}</Badge></div>
                <div><strong>Institution:</strong> {user.institution}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div>
                  <strong>Token Expires:</strong> {new Date(user.exp * 1000).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="current-term-only"
                    checked={includeCurrentTermOnly}
                    onCheckedChange={(checked) => setIncludeCurrentTermOnly(checked === true)}
                  />
                  <Label htmlFor="current-term-only" className="text-sm">
                    Current term only ({getCurrentTermName()})
                  </Label>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSearchUserCourses}
                    disabled={searchLoading}
                    className="flex items-center gap-2"
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search My Courses {!includeCurrentTermOnly && "(All Terms)"}
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={handleQuickCreateCourse}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="h-4 w-4" />
                    Quick Create Test Course
                  </Button>
                  
                  <Button variant="destructive" onClick={logout} size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-name">Enter Full Name (e.g., Ernest Benz)</Label>
                <Input
                  id="custom-name"
                  placeholder="Enter full name..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customName.trim() && !authLoading) {
                      handleLogin();
                    }
                  }}
                />
                {customName.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will create: {generateUsername(customName)}@smith.edu
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleLogin}
                disabled={!customName.trim() || authLoading}
                className="flex items-center gap-2"
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {authLoading ? 'Logging in...' : 'Login as Mock User'}
              </Button>
              
              {loginError && (
                <div className="p-3 border border-red-200 bg-red-50 rounded-md text-red-700 text-sm">
                  <strong>Error:</strong> {loginError}
                </div>
              )}
              
              {loginSuccess && (
                <div className="p-3 border border-green-200 bg-green-50 rounded-md text-green-700 text-sm">
                  ✅ {loginSuccess}
                </div>
              )}
              
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                💡 <strong>Mock Login:</strong> This calls the backend mock-login endpoint to generate a real JWT token for testing. Token will be valid for 1 hour.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Search Results */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Course Search Results
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {totalRecords} courses found
                </Badge>
                {courses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    Clear
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchLoading && (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching courses...
              </div>
            )}
            
            {searchError && (
              <div className="p-3 border border-red-200 bg-red-50 rounded-md text-red-700 text-sm">
                <strong>Error:</strong> {searchError}
              </div>
            )}
            
            {courses.length > 0 && !searchLoading && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Found {courses.length} courses for <strong>{user?.full_name}</strong>
                    {!includeCurrentTermOnly && " across all terms"}
                  </div>
                  {!includeCurrentTermOnly && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                      💡 <strong>Historical Course Search:</strong> All terms shown to enable copying resources from courses taught years ago. Use the Course Listing IDs to fetch associated resources.
                    </div>
                  )}
                </div>
                
                <div className="grid gap-3">
                  {courses
                    .sort((a, b) => {
                      // Sort by term (newest first), then by course name
                      const termA = a.courseListingObject?.termObject?.name || '';
                      const termB = b.courseListingObject?.termObject?.name || '';
                      if (termA !== termB) {
                        return termB.localeCompare(termA); // Newest terms first
                      }
                      return (a.name || '').localeCompare(b.name || '');
                    })
                    .map((course) => {
                      const term = course.courseListingObject?.termObject;
                      if (!term) return null;
                      
                      const isCurrentTerm = term.name === getCurrentTermName();
                      const isPastTerm = new Date(term.endDate) < new Date();
                      
                      return (
                        <div
                          key={course.id}
                          className={`p-3 border rounded-lg space-y-2 ${
                            isCurrentTerm 
                              ? "border-green-200 bg-green-50" 
                              : isPastTerm 
                              ? "border-blue-200 bg-blue-50" 
                              : "border-orange-200 bg-orange-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{course.name || 'Untitled Course'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {course.departmentObject?.name || 'Unknown Department'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex gap-1">
                                <Badge 
                                  variant={isCurrentTerm ? "default" : isPastTerm ? "secondary" : "outline"}
                                >
                                  {term.name}
                                </Badge>
                                {isCurrentTerm && (
                                  <Badge variant="default" className="text-xs">Current</Badge>
                                )}
                                {!isCurrentTerm && isPastTerm && (
                                  <Badge variant="secondary" className="text-xs">Available to Copy</Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="mt-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleCreateFromSearchResult(course)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Course
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            <div><strong>Course Number:</strong> <code className="bg-gray-100 px-1 rounded">{course.courseNumber || 'N/A'}</code></div>
                            <div><strong>Course Listing ID:</strong> <code className="bg-gray-100 px-1 rounded">{course.courseListingId}</code></div>
                            <div><strong>Location:</strong> {course.courseListingObject?.locationObject?.name || 'N/A'}</div>
                            <div><strong>Term Dates:</strong> {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}</div>
                            <div><strong>Instructors:</strong> {
                              course.courseListingObject?.instructorObjects
                                ?.map(i => i?.name)
                                .filter(Boolean)
                                .join(", ") || 'N/A'
                            }</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {courses.length === 0 && !searchLoading && !searchError && (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No courses found. Try searching for courses taught by the current user.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <CourseModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        onSave={handleSaveCourse}
        initialData={selectedCourseData}
      />
    </div>
  );
};