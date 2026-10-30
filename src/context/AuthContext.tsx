import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from '../types';
import { DatabaseService } from '../services/db';
import { googleSignIn, googleLogout, setAccessToken, getAccessToken } from '../config/googleAuth';

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  isGoogleConnected: boolean;
  googleUserEmail: string | null;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  showInactivityWarning: boolean;
  inactivityCountdown: number;
  dismissInactivityWarning: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'jcms_current_user_session';
const GOOGLE_EMAIL_KEY = 'jcms_google_user_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem(GOOGLE_EMAIL_KEY);
  });

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(120); // 2 minutes warning

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Read configured timeout in minutes (default 30 min)
  const getTimeoutMs = useCallback(() => {
    const settings = DatabaseService.getSettings();
    const mins = settings.inactivityTimeoutMinutes || 30;
    return mins * 60 * 1000;
  }, []);

  const performLogout = useCallback(async (isTimeout = false) => {
    if (currentUser) {
      DatabaseService.logAudit(
        currentUser.name,
        isTimeout ? 'Session Expired (Auto Logout)' : 'User Logout',
        'Auth',
        currentUser.userId,
        isTimeout ? 'User logged out automatically due to 30m inactivity' : 'User manually logged out'
      );
    }
    setCurrentUser(null);
    setGoogleUserEmail(null);
    setIsGoogleConnected(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(GOOGLE_EMAIL_KEY);
    setAccessToken(null);
    try {
      await googleLogout();
    } catch {
      // ignore
    }
    setShowInactivityWarning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, [currentUser]);

  // Reset activity on user interaction
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showInactivityWarning) {
      setShowInactivityWarning(false);
      setInactivityCountdown(120);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [showInactivityWarning]);

  // Inactivity supervisor loop
  useEffect(() => {
    if (!currentUser) return;

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeoutMs = getTimeoutMs();
      const warningThreshold = timeoutMs - 120000; // 2 minutes before logout

      if (elapsed >= timeoutMs) {
        performLogout(true);
      } else if (elapsed >= warningThreshold && !showInactivityWarning) {
        setShowInactivityWarning(true);
        const remainingSec = Math.max(0, Math.floor((timeoutMs - elapsed) / 1000));
        setInactivityCountdown(remainingSec);

        countdownIntervalRef.current = setInterval(() => {
          setInactivityCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              performLogout(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    timerRef.current = setInterval(checkInactivity, 5000);

    // Event listeners to detect activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleEvent = () => resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      events.forEach((ev) => window.removeEventListener(ev, handleEvent));
    };
  }, [currentUser, getTimeoutMs, showInactivityWarning, performLogout, resetInactivityTimer]);

  // Check initial token status
  useEffect(() => {
    getAccessToken().then((t) => {
      setIsGoogleConnected(!!t);
    });
  }, []);

  const loginWithCredentials = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const users = DatabaseService.getUsers();
    // Default admin fallback if not yet initialized
    let matched = users.find(
      (u) => u.username.toLowerCase() === cleanUser || u.name.toLowerCase() === cleanUser
    );

    // Check credentials:
    // For admin: default is 'admin' / 'admin123' or 'admin@123' or any operator
    const isValidAdmin = (cleanUser === 'admin' || cleanUser === 'administrator') &&
      (cleanPass === 'admin123' || cleanPass === 'admin@123' || cleanPass === 'admin');

    const isValidOperator = cleanPass === 'password123' || cleanPass === '123456' || cleanPass === 'admin123';

    if (isValidAdmin && !matched) {
      matched = {
        userId: 'USR-001',
        name: 'Chief Admin',
        username: 'admin',
        role: 'Admin',
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0],
      };
    }

    if (!matched && !isValidAdmin) {
      return { success: false, error: 'Invalid Username or Password. Please check your credentials.' };
    }

    if (matched && matched.status === 'Inactive') {
      return { success: false, error: 'Your account has been deactivated. Please contact administrator.' };
    }

    if (!isValidAdmin && !isValidOperator) {
      return { success: false, error: 'Incorrect password entered.' };
    }

    const authenticatedUser: User = matched || {
      userId: 'USR-001',
      name: 'Chief Admin',
      username: 'admin',
      role: 'Admin',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(authenticatedUser);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    lastActivityRef.current = Date.now();

    DatabaseService.logAudit(
      authenticatedUser.name,
      'User Login',
      'Auth',
      authenticatedUser.userId,
      `User ${authenticatedUser.name} (${authenticatedUser.role}) logged in successfully`
    );

    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await googleSignIn();
      if (!res || !res.accessToken) {
        return { success: false, error: 'Google authentication was not completed.' };
      }

      setIsGoogleConnected(true);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to authenticate with Google' };
    }
  };

  const logout = async () => {
    await performLogout(false);
  };

  const dismissInactivityWarning = () => {
    resetInactivityTimer();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isGoogleConnected,
        googleUserEmail,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        resetInactivityTimer,
        showInactivityWarning,
        inactivityCountdown,
        dismissInactivityWarning,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
