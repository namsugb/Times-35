"use client"

import { useState } from "react"
import { TimeSlotSelector, SelectedTimesDisplay } from "@/components/time-slot-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestTimeSelectorPage() {
    const [selectedTimes, setSelectedTimes] = useState<string[]>([])

    const handleReset = () => {
        setSelectedTimes([])
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>시간 선택 컴포넌트 테스트</CardTitle>
                    <CardDescription>
                        클릭하거나 드래그해서 시간을 선택하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 시간 선택기 */}
                    <TimeSlotSelector
                        selectedTimes={selectedTimes}
                        onChange={setSelectedTimes}
                    />

                    {/* 선택된 시간 표시 */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-3">선택된 시간대</h3>
                        <SelectedTimesDisplay times={selectedTimes} />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                        <Button onClick={handleReset} variant="outline">
                            초기화
                        </Button>
                        <Button
                            onClick={() => console.log('선택된 시간:', selectedTimes)}
                            disabled={selectedTimes.length === 0}
                        >
                            선택 완료 ({selectedTimes.length}개)
                        </Button>
                    </div>

                    {/* 개발자용: 선택된 시간 JSON */}
                    {selectedTimes.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                개발자 보기 (JSON)
                            </summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto">
                                {JSON.stringify(selectedTimes, null, 2)}
                            </pre>
                        </details>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

