import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/config/endpoints';

export interface PreviousCourse {
  courseListingId: string;
  courseNumber: string;
  courseName: string;
  term: string;
  instructor: string;
  resourceCount: number;
  electronicCount: number; // Separate count for display
  physicalCount: number;   // Separate count for display
  isExactMatch: boolean;
}

export interface PhysicalReserve {
  temporaryItemId: string;
  barcode?: string;
  callNumber?: string;
  copiedItem?: {
    title?: string;
    contributors?: Array<{ name: string; primary?: boolean }>;
    publication?: Array<{ publisher?: string; dateOfPublication?: string }>;
    callNumber?: string;
    barcode?: string;
  };
  item?: {
    title?: string;
    contributors?: Array<{ name: string; primary?: boolean }>;
    publication?: Array<{ publisher?: string; dateOfPublication?: string }>;
    effectiveCallNumberComponents?: { callNumber?: string };
    barcode?: string;
  };
}

export interface ElectronicResource {
  id: string;
  title?: string;
  authors?: string;
  url?: string;
  item_url?: string;
  publication_title?: string;
  publication_date?: string;
  notes?: string;
  description?: string;
  external_note?: string;
  internal_note?: string;
  folder_name?: string;
  resource_type?: string;
  order?: string | number;
}

export interface PreviewResource {
  type: 'physical' | 'electronic' | string;
  title: string;
  author?: string;
  materialType: string;
  publicationInfo?: string;
  callNumber?: string;
  url?: string;
  notes?: string;
  order?: number; // Preserve display order from backend
  discoveryUrl?: string; // URL to view physical item in discovery interface
  description?: string; // Rich description from electronic resources
  _originalReserve?: PhysicalReserve;
  _originalResource?: ElectronicResource;
}

export const useCourseCloning = () => {
  const [loadingPreviousCourses, setLoadingPreviousCourses] = useState(false);
  const [previousCourses, setPreviousCourses] = useState<PreviousCourse[]>([]);
  const [cloningFromCourse, setCloningFromCourse] = useState<string | null>(null);

  const fetchPreviousCourses = useCallback(async (
    courseCode: string,
    instructorName: string,
    mode: 'exact' | 'all' = 'exact'
  ) => {
    setLoadingPreviousCourses(true);
    
    try {
      let query: string;
      
      if (mode === 'exact') {
        query = `(courseNumber=="${courseCode}" and department.name=="SC*" and courseListing.instructorObjects="${instructorName}*") sortby courseListing.termObject.name/sort.descending`;
      } else {
        query = `(department.name=="SC*" and courseListing.instructorObjects="${instructorName}*") sortby name`;
      }
      
      const searchUrl = `${API_ENDPOINTS.FOLIO.BASE_URL}${API_ENDPOINTS.FOLIO.SEARCH_COURSES}?query=${encodeURIComponent(query)}`;
      
      const coursesRes = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!coursesRes.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const coursesData = await coursesRes.json();
      const courses = coursesData.data?.courses || [];
      
      // Fetch resource counts for each course
      const coursesWithCounts = await Promise.all(
        courses.map(async (course: { 
          courseListingObject?: { id?: string; termObject?: { name?: string }; instructorObjects?: Array<{ name?: string }>; };
          courseListingId?: string;
          courseNumber?: string;
          name?: string;
        }) => {
          try {
            const courseListingId = course.courseListingObject?.id || course.courseListingId;
            
            let electronicCount = 0;
            let physicalCount = 0;
            
            // Fetch electronic resources count from merged resources
            try {
              const electronicRes = await fetch(
                `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/course/get-merged-resources?courseListingId=${courseListingId}`,
                {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  mode: 'cors',
                  credentials: 'omit'
                }
              );
              
              if (electronicRes.ok) {
                const electronicData = await electronicRes.json();
                const resources = electronicData.resources || [];
                electronicCount = resources.filter((r: { resource_type?: string }) => r.resource_type === 'electronic').length;
              }
            } catch (error) {
              console.log('Electronic resources fetch failed:', error);
            }
            
            // Fetch physical items count from FOLIO course listings
            try {
              const physicalRes = await fetch(
                `${API_ENDPOINTS.FOLIO.BASE_URL}/search/search-course-listings?courseListingId=${courseListingId}`,
                {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  mode: 'cors',
                  credentials: 'omit'
                }
              );
              
              if (physicalRes.ok) {
                const physicalData = await physicalRes.json();
                const reserves = physicalData.data?.reserves || physicalData.reserves || [];
                physicalCount = reserves.length;
              }
            } catch (error) {
              console.log('Physical reserves fetch failed:', error);
            }
            
            const courseNumber = course.courseNumber || '';
            const isExactMatch = courseNumber === courseCode;
            
            return {
              courseListingId,
              courseNumber,
              courseName: course.name || 'Unknown Course',
              term: course.courseListingObject?.termObject?.name || 'Unknown Term',
              instructor: course.courseListingObject?.instructorObjects?.[0]?.name || instructorName,
              resourceCount: electronicCount + physicalCount, // Total count
              electronicCount, // Separate electronic count
              physicalCount,   // Separate physical count
              isExactMatch,
            };
          } catch (error) {
            console.error('Failed to process course:', error);
            return null;
          }
        })
      );
      
      const validCourses = coursesWithCounts
        .filter((c): c is PreviousCourse => c !== null)
        .sort((a, b) => {
          if (a.isExactMatch && !b.isExactMatch) return -1;
          if (!a.isExactMatch && b.isExactMatch) return 1;
          return b.term.localeCompare(a.term);
        });
      
      setPreviousCourses(validCourses);
      return validCourses;
      
    } catch (error) {
      console.error('Failed to load previous courses:', error);
      toast.error('Failed to load previous courses');
      return [];
    } finally {
      setLoadingPreviousCourses(false);
    }
  }, []);

  const fetchCourseResources = useCallback(async (courseListingId: string) => {
    try {
      let physicalReserves: PhysicalReserve[] = [];
      let electronicResources: ElectronicResource[] = [];
      
      // Fetch merged resources (includes both electronic and physical references)
      try {
        const mergedRes = await fetch(
          `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/course/get-merged-resources?courseListingId=${courseListingId}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
            credentials: 'omit'
          }
        );
        
        if (mergedRes.ok) {
          const mergedData = await mergedRes.json();
          const resources = mergedData.resources || [];
          
          // Separate electronic and physical resources
          electronicResources = resources
            .filter((r: { resource_type?: string }) => r.resource_type === 'electronic')
            .map((r: { order?: string | number; [key: string]: unknown }) => ({
              ...r,
              order: r.order ? (typeof r.order === 'string' ? parseInt(r.order, 10) : r.order) : 999999,
            } as ElectronicResource));
        }
      } catch (error) {
        console.error('Failed to fetch merged resources:', error);
      }
      
      // Fetch physical reserves with full FOLIO data
      try {
        const physicalRes = await fetch(
          `${API_ENDPOINTS.FOLIO.BASE_URL}/search/search-course-listings?courseListingId=${courseListingId}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
            credentials: 'omit'
          }
        );
        
        if (physicalRes.ok) {
          const physicalData = await physicalRes.json();
          physicalReserves = physicalData.data?.reserves || physicalData.reserves || [];
        }
      } catch (error) {
        console.log('Physical reserves unavailable:', error);
      }
      
      return { physicalReserves, electronicResources };
    } catch (error) {
      console.error('Failed to fetch course resources:', error);
      return { physicalReserves: [], electronicResources: [] };
    }
  }, []);

  return {
    loadingPreviousCourses,
    previousCourses,
    cloningFromCourse,
    setCloningFromCourse,
    fetchPreviousCourses,
    fetchCourseResources,
  };
};
