"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>("확인 중...")
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  useEffect(() => {
    checkConnection()
    checkEnvVars()
  }, [])

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from("appointments").select("count(*)").limit(1)

      if (error) {
        setConnectionStatus(`❌ 연결 실패: ${error.message}`)
      } else {
        setConnectionStatus("✅ 연결 성공!")
      }
    } catch (err) {
      setConnectionStatus(`❌ 오류: ${err}`)
    }
  }

  const checkEnvVars = () => {
    const vars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ 없음",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 없음",
    }
    setEnvVars(vars)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Supabase 연결 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>연결 상태:</span>
                <Badge variant={connectionStatus.includes("✅") ? "default" : "destructive"}>{connectionStatus}</Badge>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">환경 변수 상태:</h3>
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded">{key}</code>
                    <Badge variant={value.includes("✅") ? "default" : "destructive"}>{value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>프로젝트 URL:</strong>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || "설정되지 않음"}
                </code>
              </div>
              <div>
                <strong>워크스페이스:</strong> 만날래말래_with gpt
              </div>
              <div>
                <strong>연동 방식:</strong> Vercel Marketplace
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
