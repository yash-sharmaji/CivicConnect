import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase environment variables. Check backend/.env');
  process.exit(1);
}

// 1. Standard Client (Uses ANON key)
// Suitable for operations on behalf of users, verifying client JWTs, etc.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// 2. Admin Client (Uses SERVICE_ROLE key)
// Bypasses Row Level Security (RLS). Must be kept secure and used ONLY
// for backend operations like awarding XP, staff actions, and auto-verifications.
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

if (!supabaseAdmin) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Elevated backend operations will fail.');
}
