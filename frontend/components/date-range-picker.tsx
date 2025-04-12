"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Define a type for the month range
interface MonthRange {
  from: Date;
  to: Date;
}

interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  // Default to the range from the start of the current year to the current month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11 (January is 0, May is 4)
  const startOfCurrentYear = startOfMonth(setMonth(setYear(new Date(), currentYear), 0)); // January 1st
  const endOfCurrentMonth = endOfMonth(new Date()); // Last day of the current month

  // Default range
  const defaultRange: MonthRange = {
    from: startOfCurrentYear,
    to: endOfCurrentMonth,
  };

  const [monthRange, setMonthRange] = React.useState<MonthRange | undefined>(defaultRange);
  const [isOpen, setIsOpen] = React.useState(false); // Track popover open state
  const [firstSelectedMonth, setFirstSelectedMonth] = React.useState<Date | null>(null); // Track the first clicked month

  // State for the currently displayed year, restricted to 2024 to current year
  const minYear = 2024;
  const maxYear = currentYear;
  const [selectedYear, setSelectedYear] = React.useState(currentYear);

  // Generate a list of months for the selected year
  const months = Array.from({ length: 12 }, (_, i) =>
    startOfMonth(new Date(selectedYear, i, 1))
  );

  // 获取整个月的日期范围（从1日到月末）
  const getFullMonthRange = (month: Date): MonthRange => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return { from: monthStart, to: monthEnd };
  };

  // 获取日期范围内每个月的完整范围
  const getMultiMonthRange = (start: Date, end: Date): MonthRange => {
    // 确保使用指定月份的第一天和最后一天
    const startMonth = startOfMonth(start);
    const endMonth = endOfMonth(end);
    return { from: startMonth, to: endMonth };
  };

  // Handle single click on a month
  const handleSingleClick = (selectedMonth: Date) => {
    if (!firstSelectedMonth) {
      // First click: Clear previous selection and set the first month
      setFirstSelectedMonth(selectedMonth);
      const fullMonthRange = getFullMonthRange(selectedMonth);
      // 只更新内部状态，不通知父组件
      setMonthRange(fullMonthRange);
    } else {
      // Second click: Set the range and close the popover
      let newRange;
      if (selectedMonth < firstSelectedMonth) {
        // 如果第二次选择的月份在第一次选择的月份之前
        // 确保范围从第二次选择的月份的第一天开始
        // 到第一次选择的月份的最后一天结束
        const startMonth = startOfMonth(selectedMonth);
        const endMonth = endOfMonth(firstSelectedMonth);
        newRange = { from: startMonth, to: endMonth };
      } else {
        // 如果第二次选择的月份在第一次选择的月份之后或相同
        // 确保范围从第一次选择的月份的第一天开始
        // 到第二次选择的月份的最后一天结束
        const startMonth = startOfMonth(firstSelectedMonth);
        const endMonth = endOfMonth(selectedMonth);
        newRange = { from: startMonth, to: endMonth };
      }
      
      setMonthRange(newRange);
      
      // 关键修改：将新的日期范围传递给父组件，严格确保日期格式正确
      if (setDate) {
        console.log("更新日期范围:", {
          from: `${newRange.from.getFullYear()}-${(newRange.from.getMonth() + 1).toString().padStart(2, '0')}-01`,
          to: `${newRange.to.getFullYear()}-${(newRange.to.getMonth() + 1).toString().padStart(2, '0')}-${new Date(newRange.to.getFullYear(), newRange.to.getMonth() + 1, 0).getDate()}`
        });
        setDate(newRange);
      }
      
      setFirstSelectedMonth(null); // Reset for the next selection
      setIsOpen(false); // Close the popover
    }
  };

  // Handle double click on a month
  const handleDoubleClick = (selectedMonth: Date) => {
    // Double click: Select the single month and close the popover
    // 确保精确计算月份的第一天和最后一天
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // 计算月份的第一天
    const firstDayOfMonth = new Date(year, month, 1);
    
    // 计算月份的最后一天 (下个月的第0天就是当前月的最后一天)
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const fullMonthRange = { from: firstDayOfMonth, to: lastDayOfMonth };
    setMonthRange(fullMonthRange);
    
    // 关键修改：将新的日期范围传递给父组件，明确指定日期
    if (setDate) {
      // 格式化为精确的日期字符串以便调试
      console.log("更新日期范围(双击):", {
        from: `${year}-${(month + 1).toString().padStart(2, '0')}-01`,
        to: `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDayOfMonth.getDate()}`,
        fromDate: fullMonthRange.from,
        toDate: fullMonthRange.to
      });
      
      setDate(fullMonthRange);
    }
    
    setFirstSelectedMonth(null); // Reset for the next selection
    setIsOpen(false); // Close the popover
  };

  // Format the selected range for display with full year
  const formatRange = (range: MonthRange | undefined) => {
    if (!range) return "Pick a month range";
    const { from, to } = range;
    
    // 确保使用月份进行判断，而不是具体日期
    const fromMonth = from.getMonth();
    const fromYear = from.getFullYear();
    const toMonth = to.getMonth();
    const toYear = to.getFullYear();
    
    if (fromYear === toYear && fromMonth === toMonth) {
      return `${format(from, "MMM")} ${fromYear}`;
    }
    
    if (fromYear === toYear) {
      return `${format(from, "MMM")} - ${format(to, "MMM")} ${toYear}`;
    }
    
    return `${format(from, "MMM")} ${fromYear} - ${format(to, "MMM")} ${toYear}`;
  };

  // Reset to default range if the popover is closed without a selection
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (!monthRange) {
        setMonthRange(defaultRange);
        
        // 关键修改：如果重置到默认范围，也需要通知父组件
        if (setDate) {
          setDate(defaultRange);
        }
      }
      setFirstSelectedMonth(null); // Reset the first selected month when closing
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "border-none w-[153px] justify-start text-left font-normal",
              !monthRange && "text-muted-foreground"
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {monthRange ? formatRange(monthRange) : <span>Pick a month range</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-none w-[240px] p-5" align="start">
          {/* Year selector with restricted range */}
          <div className="flex justify-between items-center mb-3">
            <Button
              className="border-none"
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear((prev) => Math.max(minYear, prev - 1))}
              disabled={selectedYear <= minYear}
            >
              <ChevronLeft className="h-4 w-4 border-none" />
            </Button>
            <div className="text-sm font-medium">{selectedYear}</div>
            <Button
              className="border-none"
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear((prev) => Math.min(maxYear, prev + 1))}
              disabled={selectedYear >= maxYear}
            >
              <ChevronRight className="h-4 w-4 border-none" />
            </Button>
          </div>
          {/* Month grid: 3 columns, 4 rows */}
          <div className="grid grid-cols-3 gap-1">
            {months.map((month) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              
              const isSelected =
                monthRange &&
                ((monthRange.from <= monthEnd && monthRange.to >= monthStart) || 
                 (monthStart.getFullYear() === monthRange.from.getFullYear() && 
                  monthStart.getMonth() === monthRange.from.getMonth()) ||
                 (monthStart.getFullYear() === monthRange.to.getFullYear() && 
                  monthStart.getMonth() === monthRange.to.getMonth()));
                
              return (
                <Button
                  key={month.toISOString()}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "border-none text-sm h-8",
                    "text-sm h-8",
                    "transition-colors",
                    !isSelected && "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleSingleClick(month)}
                  onDoubleClick={() => handleDoubleClick(month)}
                >
                  {format(month, "MMM")}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}