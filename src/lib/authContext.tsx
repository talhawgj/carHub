'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from './supabase';
import type { AdminUser } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (phone: string, fullName: string, cnic: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const sendPhoneOtp = async (phone: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) throw error;
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signUp = async (phone: string, fullName: string, cnic: string) => {
    const supabase = getSupabaseClient();
    
    // In Supabase, phone auth signup is basically the same as signInWithOtp initially.
    // However, if we are saving extra metadata (fullName, CNIC):
    // For a real app we'd first create the user or update their profile after OTP verification.
    // For the UI flow MVP, we'll trigger the OTP send here, and we'll save the metadata to local state to be synced after verification.
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          full_name: fullName,
          cnic_hash: cnic,
        },
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendPhoneOtp, verifyPhoneOtp, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
