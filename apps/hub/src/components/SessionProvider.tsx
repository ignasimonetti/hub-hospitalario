"use client";

import { pocketbase } from "../lib/auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextType {
  user: any | null;
  status: SessionStatus;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    console.log('🔄 SessionProvider: Initializing session check...');
    
    const updateUserState = () => {
      const currentUser = pocketbase.authStore.model;
      const isValid = pocketbase.authStore.isValid;

      if (isValid && currentUser) {
        setUser(currentUser);
        setStatus("authenticated");
        console.log('✅ SessionProvider: Status set to AUTHENTICATED. User:', currentUser?.id);
      } else {
        setUser(null);
        setStatus("unauthenticated");
        console.log('❌ SessionProvider: Status set to UNAUTHENTICATED.');
      }
    };

    // Initial check
    updateUserState();

    // Listen for auth changes
    const unsubscribe = pocketbase.authStore.onChange((token, model) => {
      console.log('🔄 SessionProvider: Auth store changed. Token:', token ? 'present' : 'absent', 'Model:', model ? 'present' : 'absent');
      updateUserState();
    }, true); // true to trigger immediately on mount if authStore already has data

    return () => {
      // Cleanup listener on unmount
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return (
    <SessionContext.Provider value={{ user, status }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);