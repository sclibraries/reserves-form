# Mock Login Integration Complete! 🎉

## What Was Implemented

Your AuthDebugPanel and authStore now integrate with the backend mock-login endpoint to generate real JWT tokens for testing!

## Features

### ✅ Backend Mock Login Endpoint
- **URL:** `https://libtools2.smith.edu/course-reserves/backend/web/faculty-submission/mock-login`
- **Method:** POST
- **Environment:** Development only (disabled in production)
- **Token Validity:** 1 hour

### ✅ Frontend Integration
- **AuthDebugPanel:** Updated UI with error/success messages
- **authStore:** Async mock login with token storage
- **Token Storage:** localStorage (accessToken & refreshToken)
- **Helper Functions:** `getAccessToken()` and `getAuthHeaders()`

## How to Use

### 1. Testing Authentication

1. Open your app in the browser
2. Enter a full name (e.g., "Ernest Benz")
3. Click "Login as Mock User"
4. See success message and user details populate

**What happens:**
- Frontend calls `POST /faculty-submission/mock-login` with the full name
- Backend generates JWT token with Shibboleth-like payload
- Frontend stores tokens in localStorage
- User state updates in authStore

### 2. Using Tokens in API Calls

```typescript
import { getAuthHeaders } from '@/store/authStore';
import { API_ENDPOINTS } from '@/config/endpoints';

// Example: Fetch user's submissions
const fetchSubmissions = async () => {
  const response = await fetch(
    `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/faculty-submission/index`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...getAuthHeaders(), // Adds: Authorization: Bearer <token>
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};
```

### 3. Username Generation

The backend automatically generates usernames from full names:

| Full Name | Username | Email |
|-----------|----------|-------|
| Ernest Benz | ebenz | ebenz@smith.edu |
| Jane Smith | jsmith | jsmith@smith.edu |
| Mary Anne Wilson | mwilson | mwilson@smith.edu |

**Pattern:** First initial + Last name (lowercase)

## Token Payload Structure

The mock-login endpoint generates a JWT token with this payload:

```json
{
  "iat": 1760647232,          // Issued at timestamp
  "exp": 1760650832,          // Expiration (1 hour later)
  "username": "ebenz",        // Generated username
  "role": "faculty",          // User role
  "id": "ebenz",              // Stable identifier
  "full_name": "Ernest Benz", // Full name entered
  "email": "ebenz@smith.edu", // Generated email
  "institution": "SM"         // Institution code (SM = Smith)
}
```

## API Response

When you successfully log in, the backend returns:

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "username": "ebenz",
    "full_name": "Ernest Benz",
    "email": "ebenz@smith.edu",
    "institution": "SM",
    "role": "faculty",
    "exp": 1760650832
  },
  "message": "Mock login successful. This token is valid for 1 hour.",
  "warning": "This is a MOCK token for development only!"
}
```

## Updated Files

### 1. `authStore.ts`
- ✅ Added `getAccessToken()` helper function
- ✅ Added `getAuthHeaders()` helper function
- ✅ Updated `setMockUser()` to call backend API
- ✅ Added token storage to localStorage
- ✅ Updated `logout()` to clear tokens
- ✅ Removed old mock users object

### 2. `AuthDebugPanel.tsx`
- ✅ Added async login handling
- ✅ Added error/success messages
- ✅ Added loading state
- ✅ Added informational help text
- ✅ Clear input on successful login

### 3. `endpoints.js`
- ✅ Added `MOCK_LOGIN` endpoint constant

## Testing Examples

### Test 1: Basic Login
```typescript
import { useAuthStore } from '@/store/authStore';

const { setMockUser } = useAuthStore();

// Login as Ernest Benz
await setMockUser('Ernest Benz');
```

### Test 2: Login with Custom Institution
```typescript
// Login as Hampshire College faculty
await setMockUser('Jane Smith', 'faculty', 'HC');
```

### Test 3: Check Token
```typescript
import { getAccessToken } from '@/store/authStore';

const token = getAccessToken();
console.log('Current token:', token);
```

### Test 4: Make Authenticated API Call
```typescript
import { getAuthHeaders } from '@/store/authStore';

const response = await fetch('/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  },
});
```

## Error Handling

The system handles errors gracefully:

### Network Errors
```
❌ Error: Failed to fetch
```

### Backend Errors
```
❌ Error: Mock login is disabled in production
```

### Invalid Response
```
❌ Error: HTTP 500
```

All errors are displayed in the AuthDebugPanel UI and logged to console.

## Token Expiration

Tokens expire after 1 hour. The system includes:

- ✅ Token expiration check
- ✅ Automatic logout on expired token
- ✅ Visual display of expiration time in UI

## Security Notes

⚠️ **Development Only:** The mock-login endpoint is disabled in production (returns 403 Forbidden)

✅ **Real JWT Tokens:** Mock tokens use the same structure, secret key, and validation as production Shibboleth tokens

✅ **No Database Impact:** Mock users don't create database records

## Next Steps

Now you can:

1. ✅ Test user authentication flow
2. ✅ Create faculty submissions
3. ✅ Fetch user-specific data
4. ✅ Test course cloning features
5. ✅ Build submission tracking UI

## Example Workflow

```typescript
// 1. Login
await setMockUser('Ernest Benz');

// 2. Search courses
await searchCoursesByInstructor('Ernest Benz');

// 3. Fetch submissions with auth
const submissions = await fetch(
  `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/faculty-submission/index`,
  { headers: getAuthHeaders() }
);

// 4. Create new submission with auth
const newSubmission = await fetch(
  `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/faculty-submission/create`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(submissionData),
  }
);

// 5. Logout
logout();
```

## Console Output

When logging in, you'll see:

```
🧪 Setting mock user: Ernest Benz
✅ Mock login successful: {username: "ebenz", full_name: "Ernest Benz", ...}
⚠️ Warning: This is a MOCK token for development only!
```

## Troubleshooting

### Token not found
- Check localStorage: `localStorage.getItem('accessToken')`
- Verify login was successful
- Check console for errors

### 401 Unauthorized
- Token may be expired (check `user.exp`)
- Token may be missing from request
- Re-login to get fresh token

### CORS errors
- Verify backend CORS settings
- Check if credentials are being sent
- Verify endpoint URL is correct

---

**You're all set!** The mock login system is fully integrated and ready for testing faculty submission workflows.
