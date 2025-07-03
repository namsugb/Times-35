"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { testDatabaseConnection, createAppointment } from "@/lib/database"
import { CheckCircle2, XCircle, Database, Plus } from "lucide-react"

export default function DatabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const result = await testDatabaseConnection()
      setConnectionStatus(result)
    } catch (error: any) {
      setConnectionStatus({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createTestAppointment = async () => {
    setLoading(true)
    try {
      const testData = {
        title: `테스트 약속 ${new Date().getTime()}`,
        method: "max-available" as const,
        required_participants: 3,
        start_date: "2024-07-01",
        end_date: "2024-07-31",
        is_public: true,
        status: "active" as const,
      }

      const result = await createAppointment(testData)
      setTestResult({ success: true, data: result })
    } catch (error: any) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터베이스 연결 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? "테스트 중..." : "연결 테스트"}
            </Button>

            {connectionStatus && (
              <div
                className={`p-4 rounded-lg ${
                  connectionStatus.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {connectionStatus.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={connectionStatus.success ? "text-green-800" : "text-red-800"}>
                    {connectionStatus.message}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              약속 생성 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createTestAppointment} disabled={loading || !connectionStatus?.success} className="w-full">
              {loading ? "생성 중..." : "테스트 약속 생성"}
            </Button>

            {testResult && (
              <div
                className={`p-4 rounded-lg ${
                  testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                {testResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-800 font-medium">약속 생성 성공!</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>
                        <strong>ID:</strong> {testResult.data.id}
                      </p>
                      <p>
                        <strong>제목:</strong> {testResult.data.title}
                      </p>
                      <p>
                        <strong>공유 토큰:</strong> {testResult.data.share_token}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/vote/${testResult.data.share_token}`, "_blank")}
                    >
                      투표 페이지 열기
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-800">{testResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>환경 변수 확인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 없음"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 없음"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
