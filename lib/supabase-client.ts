import { createClient } from "@supabase/supabase-js"

// v0/Vercel에서 자동으로 제공되는 환경 변수들
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Vercel Marketplace 연동시 자동으로 제공되는 환경 변수들:
// - POSTGRES_URL
// - POSTGRES_PRISMA_URL
// - POSTGRES_URL_NON_POOLING
// - POSTGRES_USER
// - POSTGRES_HOST
// - POSTGRES_PASSWORD
// - POSTGRES_DATABASE
// - SUPABASE_SERVICE_ROLE_KEY
// - SUPABASE_ANON_KEY
// - SUPABASE_URL
// - SUPABASE_JWT_SECRET
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// - NEXT_PUBLIC_SUPABASE_URL
