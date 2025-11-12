// POCKETBASE SESSION PROVIDER - Hub Hospitalario
// Migrated from Supabase to PocketBase

"use client";

import { pocketbase } from "../lib/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Session context type for PocketBase
const SessionContext = createContext<{
  user: any | null;
  isAuthenticated: boolean;
  userStatus: string | null;
}>({ user: null, isAuthenticated: false, userStatus: null });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 SessionProvider: Initializing session check...');

    // Initialize with current user if any
    const currentUser = pocketbase.authStore.model
    console.log('🔍 SessionProvider: Current user from authStore:', currentUser);
    console.log('🔍 SessionProvider: Auth store is valid:', pocketbase.authStore.isValid);

    if (currentUser) {
      console.log('✅ SessionProvider: User found, setting authenticated state');
      setUser(currentUser);
      setIsAuthenticated(!!pocketbase.authStore.isValid);
    } else {
      console.log('❌ SessionProvider: No user found in authStore');
    }

    // Listen for auth changes
    const unsubscribe = pocketbase.authStore.onChange(() => {
      const userModel = pocketbase.authStore.model;
      setUser(userModel);
      setIsAuthenticated(!!pocketbase.authStore.isValid);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Check user status based on email verification
      const status = user.emailVerified ? "confirmed" : "pending";
      setUserStatus(status);
    } else {
      setUserStatus(null);
    }
  }, [user]);

  return (
    <SessionContext.Provider value={{ user, isAuthenticated, userStatus }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);

// Helper function to check if user is authenticated
export function useAuth() {
  const { user, isAuthenticated } = useSession();
  return { user, isAuthenticated };
}