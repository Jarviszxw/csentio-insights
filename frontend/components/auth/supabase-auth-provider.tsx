'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import supabase from '@/lib/supabase'; // Assuming your supabase client is here

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed, new session:", session);
        setSession(session);
        setIsLoading(false); // Ensure loading is false after update
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    supabase,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
} 