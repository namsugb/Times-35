import { createClient } from "@supabase/supabase-js"

// v0/Vercel에서 자동으로 제공되는 환경 변수들
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

