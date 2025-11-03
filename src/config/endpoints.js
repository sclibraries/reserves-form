// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Course Reserves Backend
  COURSE_RESERVES: {
    BASE_URL: 'https://libtools2.smith.edu/course-reserves/backend/web',
    // Add specific endpoints as needed
    SUBMISSIONS: '/submissions',
    ITEMS: '/items',
    COURSES: '/courses',
    FACULTY: '/faculty',
    FACULTY_SUBMISSION_INDEX: '/faculty-submission/index',
    FACULTY_SUBMISSION_SUBMIT_COMPLETE: '/faculty-submission/submit-complete',
    FACULTY_SUBMISSION_UPDATE: '/faculty-submission/:uuid', // PUT endpoint for updates
    FACULTY_SUBMISSION_DELETE: '/faculty-submission/:uuid', // DELETE endpoint
    GET_MERGED_RESOURCES: '/course/get-merged-resources',
    MOCK_LOGIN: '/faculty-submission/mock-login',
    // Communications endpoints
    COMMUNICATIONS: '/faculty-submission/:uuid/communications',
    COMMUNICATIONS_READ: '/faculty-submission/:uuid/communications/:id/read'
  },

  // Authentication
  AUTH: {
    BASE_URL: 'https://libtools2.smith.edu/course-reserves/backend/admin',
    LOGIN: '/login',
    LOGOUT: '/logout',
    VERIFY: '/verify'
  },

  // FOLIO Library Management System
  FOLIO: {
    BASE_URL: 'https://libtools2.smith.edu/folio/web',
    SEARCH_COURSES: '/search/search-courses',
    SEARCH_COURSE_LISTINGS: '/search/search-course-listings',
    SEARCH_INSTRUCTORS: '/search/search-instructors',
    SEARCH_ITEMS: '/search/search-items',
    SEARCH_TERMS: '/search/search-terms'
  }
};

// Default request configuration
export const DEFAULT_CONFIG = {
  timeout: 10000,
  withCredentials: false,
  headers: {
    // Use simple headers to avoid CORS preflight OPTIONS requests
    'Accept': 'application/json'
    // Removed 'Content-Type': 'application/json' for GET requests to avoid preflight
  }
};

// College codes for FOLIO queries
export const COLLEGE_CODES = {
  smith: 'SC',
  hampshire: 'HC',
  mtholyoke: 'MH',
  'mt.holyoke': 'MH',
  amherst: 'AC',
  umass: 'UM'
};

// Search keys for building queries
export const SEARCH_KEYS = {
  ALL: 'all',
  NAME: 'name',
  CODE: 'code',
  SECTION: 'section',
  INSTRUCTOR: 'instructor'
};