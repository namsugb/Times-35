"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateRangePickerProps {
  value?: { from: Date; to: Date }
  onChange?: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [startDate, setStartDate] = React.useState(value?.from ? format(value.from, "yyyy-MM-dd") : "")
  const [endDate, setEndDate] = React.useState(value?.to ? format(value.to, "yyyy-MM-dd") : "")
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (value?.from) {
      setStartDate(format(value.from, "yyyy-MM-dd"))
    }
    if (value?.to) {
      setEndDate(format(value.to, "yyyy-MM-dd"))
    }
  }, [value])

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value
    setStartDate(newStartDate)

    if (newStartDate && endDate && onChange) {
      onChange({
        from: new Date(newStartDate),
        to: new Date(endDate),
      })
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value
    setEndDate(newEndDate)

    if (startDate && newEndDate && onChange) {
      onChange({
        from: new Date(startDate),
        to: new Date(newEndDate),
      })
    }
  }

  const handleApply = () => {
    if (startDate && endDate && onChange) {
      onChange({
        from: new Date(startDate),
        to: new Date(endDate),
      })
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2 relative", className)}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal min-h-[44px] px-3 py-2",
          (!startDate || !endDate) && "text-muted-foreground",
        )}
        onClick={() => setIsOpen(true)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {startDate && endDate
            ? `${format(new Date(startDate), "yyyy.MM.dd")} - ${format(new Date(endDate), "yyyy.MM.dd")}`
            : "날짜 범위 선택"}
        </span>
      </Button>

      {/* 모달 방식 날짜 선택기 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[10000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl border max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">날짜 범위 선택</h3>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">시작일</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  max={endDate || undefined}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">종료일</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  min={startDate || undefined}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleCancel}>
                  취소
                </Button>
                <Button size="sm" className="flex-1" onClick={handleApply} disabled={!startDate || !endDate}>
                  적용
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">시작일과 종료일을 선택해주세요</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
