"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: { from: Date; to: Date }
  onChange?: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: value?.from,
    to: value?.to,
  })

  React.useEffect(() => {
    if (date?.from && date?.to && onChange) {
      onChange({ from: date.from, to: date.to })
    }
  }, [date, onChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal min-h-[44px] px-3 py-2",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "yyyy.MM.dd")} - {format(date.to, "yyyy.MM.dd")}
                  </>
                ) : (
                  format(date.from, "yyyy.MM.dd")
                )
              ) : (
                "날짜 범위 선택"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start" side="bottom" sideOffset={4}>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 2}
              fixedWeeks
              showOutsideDays={false}
              className="rounded-md"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center px-1",
                caption_label: "text-sm font-medium truncate",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100",
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2",
                cell: cn("relative p-0 text-center text-sm focus-within:relative focus-within:z-20", "flex-1 h-8 w-8"),
                day: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-normal transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                ),
                day_range_start: "day-range-start rounded-l-md",
                day_range_end: "day-range-end rounded-r-md",
                day_selected: cn(
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground",
                ),
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: () => <span className="h-4 w-4">‹</span>,
                IconRight: () => <span className="h-4 w-4">›</span>,
              }}
            />
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
              시작일과 종료일을 선택해주세요
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
