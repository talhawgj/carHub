import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (for build time)
const getDummyClient = () => ({
  from: () => ({ select: () => ({} as any) }),
  auth: {},
  storage: {},
  rpc: () => ({}),
} as any);

// Get client-side Supabase instance
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side without proper env: return dummy
      return getDummyClient();
    }
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Get server-side Supabase instance  
export const getSupabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
};

// Lazy-initialized client instance
let clientInstance: any = null;

export const supabase = {
  get instance() {
    if (!clientInstance) {
      clientInstance = getSupabaseClient();
    }
    return clientInstance;
  },
};

export const supabaseServer = getSupabaseServer;
