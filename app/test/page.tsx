"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testSupabaseConnection, checkTables } from "@/lib/test-connection"

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>("")
  const [tableStatus, setTableStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleTestConnection = async () => {
    setLoading(true)
    const isConnected = await testSupabaseConnection()
    setConnectionStatus(isConnected ? "✅ 연결 성공!" : "❌ 연결 실패")

    if (isConnected) {
      const tables = await checkTables()
      setTableStatus(tables)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase 연결 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestConnection} disabled={loading} className="w-full">
            {loading ? "테스트 중..." : "연결 테스트"}
          </Button>

          {connectionStatus && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="font-medium">{connectionStatus}</p>
            </div>
          )}

          {tableStatus.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">테이블 상태:</h3>
              {tableStatus.map((table) => (
                <div
                  key={table.table}
                  className={`p-2 rounded text-sm ${
                    table.exists ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {table.table}: {table.exists ? "✅ 존재" : "❌ 없음"}
                  {table.error && ` (${table.error})`}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
