import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase 환경 변수가 설정되지 않았습니다.")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
  throw new Error("Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string | null
          creator_auth_id: string | null
          method: "all-available" | "max-available" | "minimum-required" | "time-scheduling" | "recurring"
          required_participants: number
          weekly_meetings: number
          start_date: string | null
          end_date: string | null
          status: "active" | "completed" | "cancelled"
          share_token: string
          is_public: boolean
          created_at: string
          updated_at: string
          creator_phone: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id?: string | null
          creator_auth_id?: string | null
          method: "all-available" | "max-available" | "minimum-required" | "time-scheduling" | "recurring"
          required_participants?: number
          weekly_meetings?: number
          start_date?: string | null
          end_date?: string | null
          status?: "active" | "completed" | "cancelled"
          share_token?: string
          is_public?: boolean
          creator_phone?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string | null
          creator_auth_id?: string | null
          method?: "all-available" | "max-available" | "minimum-required" | "time-scheduling" | "recurring"
          required_participants?: number
          weekly_meetings?: number
          start_date?: string | null
          end_date?: string | null
          status?: "active" | "completed" | "cancelled"
          share_token?: string
          is_public?: boolean
        }
      }
      voters: {
        Row: {
          id: string
          appointment_id: string
          name: string
          email: string | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          voted_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          name: string
          email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          appointment_id?: string
          name?: string
          email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
        }
      }
      date_votes: {
        Row: {
          id: string
          voter_id: string
          appointment_id: string
          vote_date: string
          created_at: string
        }
        Insert: {
          id?: string
          voter_id: string
          appointment_id: string
          vote_date: string
        }
        Update: {
          id?: string
          voter_id?: string
          appointment_id?: string
          vote_date?: string
        }
      }
      time_votes: {
        Row: {
          id: string
          voter_id: string
          appointment_id: string
          vote_date: string
          vote_hour: number
          created_at: string
        }
        Insert: {
          id?: string
          voter_id: string
          appointment_id: string
          vote_date: string
          vote_hour: number
        }
        Update: {
          id?: string
          voter_id?: string
          appointment_id?: string
          vote_date?: string
          vote_hour?: number
        }
      }
      weekday_votes: {
        Row: {
          id: string
          voter_id: string
          appointment_id: string
          weekday: number
          created_at: string
        }
        Insert: {
          id?: string
          voter_id: string
          appointment_id: string
          weekday: number
        }
        Update: {
          id?: string
          voter_id?: string
          appointment_id?: string
          weekday?: number
        }
      }
    }
  }
}
