"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, XCircle, Database, Wifi } from "lucide-react"

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>("확인 중...")
  const [tableStatus, setTableStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [projectInfo, setProjectInfo] = useState<any>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setLoading(true)

    try {
      // 1. 기본 연결 테스트
      const { data, error } = await supabase.from("appointments").select("count(*)").limit(1)

      if (error) {
        setConnectionStatus(`❌ 연결 실패: ${error.message}`)
        setLoading(false)
        return
      }

      setConnectionStatus("✅ 연결 성공!")

      // 2. 테이블 존재 확인
      await checkTables()

      // 3. 프로젝트 정보 설정
      setProjectInfo({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0],
        hasAnonymousKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
    } catch (error: any) {
      setConnectionStatus(`❌ 오류: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkTables = async () => {
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
      } catch (err: any) {
        results.push({
          table,
          exists: false,
          error: err.message,
        })
      }
    }

    setTableStatus(results)
  }

  const createSampleAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          title: "테스트 약속",
          method: "max-available",
          required_participants: 3,
          start_date: "2024-07-01",
          end_date: "2024-07-31",
          is_public: true,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      alert(`✅ 테스트 약속이 생성되었습니다!\nShare Token: ${data.share_token}`)
    } catch (error: any) {
      alert(`❌ 약속 생성 실패: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* 연결 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Supabase 연결 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>연결 상태:</span>
                <Badge variant={connectionStatus.includes("✅") ? "default" : "destructive"}>{connectionStatus}</Badge>
              </div>

              <Button onClick={checkConnection} disabled={loading} className="w-full">
                {loading ? "테스트 중..." : "연결 다시 테스트"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 프로젝트 정보 */}
        {projectInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                프로젝트 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">프로젝트 URL:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{projectInfo.url}</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">프로젝트 ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{projectInfo.projectRef}</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Anonymous Key:</span>
                  <Badge variant={projectInfo.hasAnonymousKey ? "default" : "destructive"}>
                    {projectInfo.hasAnonymousKey ? "✅ 설정됨" : "❌ 없음"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 테이블 상태 */}
        {tableStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>데이터베이스 테이블 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tableStatus.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {table.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <code className="font-medium">{table.table}</code>
                    </div>
                    <Badge variant={table.exists ? "default" : "destructive"}>{table.exists ? "존재" : "없음"}</Badge>
                  </div>
                ))}

                {tableStatus.every((t) => t.exists) && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 font-medium">✅ 모든 테이블이 정상적으로 설정되었습니다!</p>
                    <Button onClick={createSampleAppointment} className="mt-3 w-full bg-transparent" variant="outline">
                      테스트 약속 생성해보기
                    </Button>
                  </div>
                )}

                {!tableStatus.every((t) => t.exists) && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800 font-medium mb-2">⚠️ 일부 테이블이 없습니다.</p>
                    <p className="text-sm text-yellow-700">
                      Supabase SQL Editor에서 테이블 생성 스크립트를 실행해주세요.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 다음 단계 */}
        <Card>
          <CardHeader>
            <CardTitle>다음 단계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ 1. Supabase 연결 완료</p>
              <p className={tableStatus.every((t) => t.exists) ? "text-green-600" : "text-yellow-600"}>
                {tableStatus.every((t) => t.exists) ? "✅" : "⏳"} 2. 데이터베이스 스키마 설정
              </p>
              <p>⏳ 3. 앱 기능 테스트</p>
              <p>⏳ 4. 실제 약속 생성 및 투표</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
