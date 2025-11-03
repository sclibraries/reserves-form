import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { API_ENDPOINTS } from '@/config/endpoints';

// Helper function to get the access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// Helper function to get auth headers for API calls
export const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Types based on Shibboleth cookie data
export interface User {
  iat: number; // issued at
  exp: number; // expiration
  username: string;
  role: string;
  id: string; // same as username for now
  full_name: string;
  email: string;
  institution: string;
}

interface AuthState {
  // Data
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (userData: Omit<User, 'iat' | 'exp'>) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  checkTokenExpiration: () => boolean;
  initializeFromCookie: () => void;
  
  // Mock data for testing
  setMockUser: (fullName: string, role?: string, institution?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        // Login with user data (simulates Shibboleth cookie processing)
        login: (userData) => {
          const now = Math.floor(Date.now() / 1000);
          const user: User = {
            ...userData,
            iat: now,
            exp: now + (8 * 60 * 60), // 8 hours from now
            id: userData.username
          };
          
          console.log('🔐 User logged in:', user.full_name, `(${user.role})`);
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        },

        // Logout
        logout: () => {
          console.log('🚪 User logged out');
          
          // Set a flag to prevent persist middleware from writing
          sessionStorage.setItem('logout-in-progress', 'true');
          
          // Step 1: Clear auth state
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
          
          // Step 2: Clear ALL localStorage keys
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('course-reserves-storage');
            localStorage.removeItem('auth-storage');
            console.log('🗑️ Cleared all localStorage keys');
          } catch (error) {
            console.error('Failed to clear localStorage:', error);
          }
          
          // Step 3: Force reload immediately
          // The sessionStorage flag will be cleared on reload
          window.location.reload();
        },

        // Update user information
        updateUser: (updates) => {
          const { user } = get();
          if (user) {
            const updatedUser = { ...user, ...updates };
            console.log('👤 User updated:', updates);
            set({ user: updatedUser });
          }
        },

        // Check if token is expired
        checkTokenExpiration: () => {
          const { user } = get();
          if (!user) return false;
          
          const now = Math.floor(Date.now() / 1000);
          const isExpired = now >= user.exp;
          
          if (isExpired) {
            console.warn('⏰ Token expired, logging out');
            get().logout();
            return false;
          }
          
          return true;
        },

        // Initialize from cookie (in production, this would read the Shibboleth cookie)
        initializeFromCookie: () => {
          set({ loading: true });
          
          // In production, this would:
          // 1. Read the Shibboleth cookie
          // 2. Validate the JWT token
          // 3. Extract user information
          // For now, we'll check if we have persisted auth state
          
          const { user } = get();
          if (user && get().checkTokenExpiration()) {
            console.log('🔄 Restored user session:', user.full_name);
            set({ isAuthenticated: true, loading: false });
          } else {
            console.log('🔍 No valid session found');
            set({ loading: false });
          }
        },

        // Mock user login for testing - calls backend mock-login endpoint
        setMockUser: async (fullName, role = 'faculty', institution = 'SM') => {
          console.log('🧪 Setting mock user:', fullName);
          set({ loading: true, error: null });
          
          try {
            const response = await fetch(
              `${API_ENDPOINTS.COURSE_RESERVES.BASE_URL}/faculty-submission/mock-login`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  full_name: fullName,
                  institution: institution,
                  role: role,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
              throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            console.log('✅ Mock login successful:', data.user);
            console.log('⚠️ Warning:', data.warning);
            
            // Store tokens in localStorage
            localStorage.setItem('accessToken', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            
            // Update state with user data from backend
            set({
              user: {
                ...data.user,
                iat: Math.floor(Date.now() / 1000),
                id: data.user.username,
              },
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
          } catch (error) {
            console.error('❌ Mock login failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ 
              loading: false,
              error: errorMessage,
              user: null,
              isAuthenticated: false
            });
            throw error;
          }
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
);