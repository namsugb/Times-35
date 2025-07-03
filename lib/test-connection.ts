import { supabase } from "./supabase"

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase.from("appointments").select("count(*)").limit(1)

    if (error) {
      console.error("Supabase 연결 오류:", error)
      return false
    }

    console.log("✅ Supabase 연결 성공!")
    return true
  } catch (error) {
    console.error("❌ Supabase 연결 실패:", error)
    return false
  }
}

// 테이블 존재 확인
export async function checkTables() {
  const tables = ["appointments", "voters", "date_votes", "time_votes", "weekday_votes"]
  const results = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1)

      results.push({
        table,
        exists: !error,
        error: error?.message,
      })
    } catch (err) {
      results.push({
        table,
        exists: false,
        error: "Unknown error",
      })
    }
  }

  return results
}
