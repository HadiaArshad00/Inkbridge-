import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AdminSession {
  email: string;
  authenticatedAt: number;
  method: 'password' | 'google';
}

interface AuthContextType {
  user: User | null;
  adminSession: AdminSession | null;
  adminEmail: string | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (password: string, email?: string) => Promise<boolean>;
  updateAdminPassword: (oldPass: string, newPass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const BOOTSTRAP_ADMIN_EMAIL = 'tenderink.story@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'InkBridge2026!Admin';
const STORAGE_PASS_KEY = 'inkbridge_custom_admin_password';
const STORAGE_SESSION_KEY = 'inkbridge_admin_session';

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminSession: null,
  adminEmail: null,
  isAdmin: false,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithPassword: async () => false,
  updateAdminPassword: async () => false,
  logout: async () => {},
  refreshAdminStatus: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Get current active password
  const getActivePassword = (): string => {
    return localStorage.getItem(STORAGE_PASS_KEY) || DEFAULT_ADMIN_PASSWORD;
  };

  const checkAdminStatus = async (currentUser: User | null): Promise<boolean> => {
    if (!currentUser) return false;

    // Check bootstrap admin email
    const isSuper = currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    try {
      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin') {
        return true;
      }

      // If this is the bootstrapped admin from runtime environment, provision their admin doc
      if (isSuper) {
        try {
          await setDoc(adminDocRef, {
            email: currentUser.email,
            role: 'admin',
            createdAt: serverTimestamp(),
          }, { merge: true });
          return true;
        } catch (e) {
          console.warn('Could not auto-write admin doc, but granting superadmin permissions:', e);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      return isSuper;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminFlag = await checkAdminStatus(currentUser);
        setIsFirebaseAdmin(adminFlag);
      } else {
        setIsFirebaseAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Password-based authorization
  const loginWithPassword = async (password: string, email: string = 'tenderink.story@gmail.com'): Promise<boolean> => {
    const activePass = getActivePassword();
    if (password.trim() === activePass.trim()) {
      const session: AdminSession = {
        email: email.trim() || 'tenderink.story@gmail.com',
        authenticatedAt: Date.now(),
        method: 'password',
      };
      setAdminSession(session);
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      return true;
    }
    throw new Error('Invalid administrator password. Please check your passcode and try again.');
  };

  // Change admin password
  const updateAdminPassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    const activePass = getActivePassword();
    if (oldPass.trim() !== activePass.trim()) {
      throw new Error('Current password does not match.');
    }
    if (newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    localStorage.setItem(STORAGE_PASS_KEY, newPass.trim());
    return true;
  };

  // Google sign in
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const adminFlag = await checkAdminStatus(result.user);
      setIsFirebaseAdmin(adminFlag);
      if (adminFlag) {
        const session: AdminSession = {
          email: result.user.email || 'tenderink.story@gmail.com',
          authenticatedAt: Date.now(),
          method: 'google',
        };
        setAdminSession(session);
        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setIsFirebaseAdmin(false);
    setAdminSession(null);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  };

  const refreshAdminStatus = async () => {
    if (user) {
      const adminFlag = await checkAdminStatus(user);
      setIsFirebaseAdmin(adminFlag);
    }
  };

  // User is admin if either Firebase auth verified admin OR active password session exists
  const isAdmin = isFirebaseAdmin || Boolean(adminSession);
  const adminEmail = user?.email || adminSession?.email || null;

  return (
    <AuthContext.Provider value={{
      user,
      adminSession,
      adminEmail,
      isAdmin,
      loading,
      loginWithGoogle,
      loginWithPassword,
      updateAdminPassword,
      logout,
      refreshAdminStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
