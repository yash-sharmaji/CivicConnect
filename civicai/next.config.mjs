/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    VITE_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
    VITE_SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    VITE_INITIAL_SUPER_ADMIN_EMAIL: process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL || process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL,
    VITE_FACEBOOK_APP_ID: process.env.VITE_FACEBOOK_APP_ID,
  }
};

export default nextConfig;
