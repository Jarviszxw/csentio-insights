"use client";

import * as React from "react";
import { format, startOfMonth, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define a type for the month range
interface MonthRange {
  from: Date;
  to: Date;
}

export function DatePickerWithRange({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  // Default to the range from the start of the current year to the current month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11 (January is 0, April is 3)
  const startOfCurrentYear = startOfMonth(setMonth(setYear(new Date(), currentYear), 0)); // January 1st
  const startOfCurrentMonth = startOfMonth(new Date()); // Start of the current month (e.g., April 1st)

  // Default range
  const defaultRange: MonthRange = {
    from: startOfCurrentYear,
    to: startOfCurrentMonth,
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

  // Handle single click on a month
  const handleSingleClick = (selectedMonth: Date) => {
    if (!firstSelectedMonth) {
      // First click: Clear previous selection and set the first month
      setFirstSelectedMonth(selectedMonth);
      setMonthRange({ from: selectedMonth, to: selectedMonth });
    } else {
      // Second click: Set the range and close the popover
      if (selectedMonth < firstSelectedMonth) {
        setMonthRange({ from: selectedMonth, to: firstSelectedMonth });
      } else {
        setMonthRange({ from: firstSelectedMonth, to: selectedMonth });
      }
      setFirstSelectedMonth(null); // Reset for the next selection
      setIsOpen(false); // Close the popover
    }
  };

  // Handle double click on a month
  const handleDoubleClick = (selectedMonth: Date) => {
    // Double click: Select the single month and close the popover
    setMonthRange({ from: selectedMonth, to: selectedMonth });
    setFirstSelectedMonth(null); // Reset for the next selection
    setIsOpen(false); // Close the popover
  };

  // Format the selected range for display with full year
  const formatRange = (range: MonthRange | undefined) => {
    if (!range) return "Pick a month range";
    const { from, to } = range;
    if (from.getTime() === to.getTime()) {
      return `${format(from, "MMM")} ${from.getFullYear()}`;
    }
    if (from.getFullYear() === to.getFullYear()) {
      return `${format(from, "MMM")} - ${format(to, "MMM")} ${to.getFullYear()}`;
    }
    return `${format(from, "MMM")} ${from.getFullYear()} - ${format(to, "MMM")} ${to.getFullYear()}`;
  };

  // Reset to default range if the popover is closed without a selection
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (!monthRange) {
        setMonthRange(defaultRange);
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
              "w-[153px] justify-start text-left font-normal",
              !monthRange && "text-muted-foreground"
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {monthRange ? formatRange(monthRange) : <span>Pick a month range</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-5" align="start">
          {/* Year selector with restricted range */}
          <div className="flex justify-between items-center mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear((prev) => Math.max(minYear, prev - 1))}
              disabled={selectedYear <= minYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">{selectedYear}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear((prev) => Math.min(maxYear, prev + 1))}
              disabled={selectedYear >= maxYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Month grid: 3 columns, 4 rows */}
          <div className="grid grid-cols-3 gap-1">
            {months.map((month) => {
              const isSelected =
                monthRange &&
                month >= monthRange.from &&
                month <= monthRange.to;
              return (
                <Button
                  key={month.toISOString()}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
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