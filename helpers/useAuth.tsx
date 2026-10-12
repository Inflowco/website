import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import superjson from 'superjson';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: number;
  organizationName?: string;
}

interface Facility {
  id: number;
  name: string;
  timezone: string;
  accessLevel: string;
}

interface AuthContextType {
  user: User | null;
  facilities: Facility[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setCurrentFacility: (facilityId: number) => void;
  currentFacilityId: number | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'compressedair_token';
const FACILITY_KEY = 'compressedair_facility';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FACILITY_KEY);
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/_api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = superjson.parse(await response.text()) as {
        user: User;
        facilities: Facility[];
      };

      setUser(data.user);
      setFacilities(data.facilities);

      // Set default facility if not set
      if (!currentFacilityId && data.facilities.length > 0) {
        const facilityId = data.facilities[0].id;
        setCurrentFacilityId(facilityId);
        localStorage.setItem(FACILITY_KEY, String(facilityId));
      }
    } catch (error) {
      console.error('Auth error:', error);
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentFacilityId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await fetch('/_api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: superjson.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = superjson.parse(await response.text()) as { error: string };
      throw new Error(error.error || 'Login failed');
    }

    const data = superjson.parse(await response.text()) as {
      token: string;
      user: User;
    };

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);

    // Fetch full user data including facilities
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    const response = await fetch('/_api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: superjson.stringify(data),
    });

    if (!response.ok) {
      const error = superjson.parse(await response.text()) as { error: string };
      throw new Error(error.error || 'Registration failed');
    }

    const result = superjson.parse(await response.text()) as {
      token: string;
      user: User;
    };

    setToken(result.token);
    setUser(result.user);
    localStorage.setItem(TOKEN_KEY, result.token);

    // Fetch full user data including facilities
    await fetchUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setFacilities([]);
    setCurrentFacilityId(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(FACILITY_KEY);
  };

  const setCurrentFacility = (facilityId: number) => {
    setCurrentFacilityId(facilityId);
    localStorage.setItem(FACILITY_KEY, String(facilityId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        facilities,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setCurrentFacility,
        currentFacilityId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for authenticated API requests
export function useAuthFetch() {
  const { token } = useAuth();

  return useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );
}
