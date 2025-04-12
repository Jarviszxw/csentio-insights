"use client";

import React, { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useDateRange } from "@/components/date-range-context";
import { fetchTotalGMV, GMVResponse } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  const { dateRange } = useDateRange();
  const [gmvData, setGmvData] = useState<GMVResponse>({
    total_gmv: 1250,
    mom_percentage: 12.5,
    trend: 'up'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestRange, setLastRequestRange] = useState<string | null>(null);

  // 当日期范围变化时获取最新数据
  useEffect(() => {
    // 记录明确的日期信息用于调试
    const fromDateStr = dateRange?.from ? new Date(dateRange.from).toISOString().split('T')[0] : 'undefined';
    const toDateStr = dateRange?.to ? new Date(dateRange.to).toISOString().split('T')[0] : 'undefined';
    const rangeDescription = `${fromDateStr} 到 ${toDateStr}`;
    
    console.log(`SectionCards: 日期范围变化: ${rangeDescription}`);
    setLastRequestRange(rangeDescription);
    
    async function loadGMVData() {
      if (!dateRange) {
        console.log("SectionCards: 日期范围为空，使用默认数据");
        return;
      }
      
      // 验证处理后的日期范围格式
      console.log("SectionCards: 处理后的日期对象:", {
        from: dateRange.from ? {
          year: dateRange.from.getFullYear(),
          month: dateRange.from.getMonth() + 1, // 显示月份时加1使其符合人类理解(1-12)
          date: dateRange.from.getDate(),
          iso: dateRange.from.toISOString()
        } : null,
        to: dateRange.to ? {
          year: dateRange.to.getFullYear(),
          month: dateRange.to.getMonth() + 1, // 显示月份时加1使其符合人类理解(1-12)
          date: dateRange.to.getDate(),
          iso: dateRange.to.toISOString()
        } : null
      });
      
      setIsLoading(true);
      console.log("SectionCards: 开始加载GMV数据...");
      
      try {
        // 获取相应日期范围的GMV数据
        const data = await fetchTotalGMV(dateRange);
        console.log("SectionCards: 获取到GMV数据:", data);
        setGmvData(data);
      } catch (error) {
        console.error("SectionCards: 加载GMV数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGMVData();
  }, [dateRange]); // 仅当dateRange变化时重新获取数据

  // 格式化GMV为货币
  const formattedGMV = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(gmvData.total_gmv);

  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-6 [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card border-none">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total GMV</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "Loading..." : formattedGMV}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {gmvData.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {gmvData.mom_percentage > 0 ? "+" : ""}
              {gmvData.mom_percentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {gmvData.trend === 'up' ? (
              <>Trending up this month <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
          {lastRequestRange && (
            <div className="text-muted-foreground text-xs">
              日期范围: {lastRequestRange}
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* 保留其他卡片 */}
      <Card className="@container/card border-none">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total Sales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border-none">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total Stores</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}