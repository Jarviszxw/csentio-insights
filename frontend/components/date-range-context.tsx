"use client";

import { formatDateToISOString } from "@/lib/utils";
import * as React from "react";
import { DateRange } from "react-day-picker";

// 创建一个带有日志和序列化值的上下文
const DateRangeContext = React.createContext<{
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}>({
  dateRange: undefined,
  setDateRange: () => {},
});

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  // 设置合理的默认日期范围：当年1月到当前月
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(currentYear, 0, 1), // 1月1日
    to: new Date(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate()), // 当前月最后一天
  });

  // 添加调试日志，观察日期范围变化
  React.useEffect(() => {
    console.log("DateRangeContext: 日期范围已更新:", 
      dateRange ? {
        from: dateRange.from ? formatDateToISOString(dateRange.from) : 'undefined',
        to: dateRange.to ? formatDateToISOString(dateRange.to) : 'undefined'
      } : 'undefined');
  }, [dateRange]);

  // 创建一个包装的setter函数，以增加调试信息
  const setDateRangeWithDebug = React.useCallback((value: React.SetStateAction<DateRange | undefined>) => {
    console.log("DateRangeContext: 设置新的日期范围");
    setDateRange(value);
  }, []);

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange: setDateRangeWithDebug }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = React.useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}