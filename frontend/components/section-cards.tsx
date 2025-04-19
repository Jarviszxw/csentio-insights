"use client";

import React, { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useDateRange } from "@/components/date-range-context";
import { fetchTotalGMV, fetchTotalSales, GMVResponse, SalesResponse, fetchTotalStores, StoresResponse } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "./ui/loading";
import { cn } from "@/lib/utils";

export function SectionCards() {
  const { dateRange } = useDateRange();

  const [gmvData, setGmvData] = useState<GMVResponse>({ total_gmv: 0, pop_percentage: 0, trend: "up" });;
  const [salesData, setSalesData] = useState<SalesResponse>({total_sales: 0, pop_percentage: 0, trend: "up"});
  const [storesData, setStoresData] = useState<StoresResponse>({total_stores: 0, added: 0, removed: 0, net_change: 0, trend: "up"});
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestRange, setLastRequestRange] = useState<string | null>(null);

  useEffect(() => {
    const fromDateStr = dateRange?.from ? new Date(dateRange.from).toISOString().split('T')[0] : 'undefined';
    const toDateStr = dateRange?.to ? new Date(dateRange.to).toISOString().split('T')[0] : 'undefined';
    const rangeDescription = `${fromDateStr} 到 ${toDateStr}`;
    
    console.log(`SectionCards: 日期范围变化: ${rangeDescription}`);
    setLastRequestRange(rangeDescription);
    
    async function loadData() {
      if (!dateRange || (!dateRange.from && !dateRange.to)) {
        console.log("SectionCards: 日期范围无效，使用默认数据");
        setGmvData({
          total_gmv: 0,
          pop_percentage: 0,
          trend: "up"
        });
        setSalesData({
          total_sales: 0,
          pop_percentage: 0,
          trend: "up"
        });
        setStoresData({
          total_stores: 0,
          added: 0,
          removed: 0,
          net_change: 0,
          trend: "up"
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log("SectionCards: 开始加载数据...");
      
      try {
        const from = dateRange?.from ?? undefined;
        const to = dateRange?.to ?? undefined;

        const [gmvData, salesData, storesData] = await Promise.all([
          fetchTotalGMV(from, to),
          fetchTotalSales(from, to),
          fetchTotalStores(from, to)
        ]);
        
        console.log("SectionCards: 获取到GMV数据:", gmvData);
        console.log("SectionCards: 获取到总销售额数据:", salesData);
        console.log("SectionCards: 获取到总店铺数量数据:", storesData);
        setGmvData(gmvData);
        setSalesData(salesData);
        setStoresData(storesData);
      } catch (error) {
        console.error("SectionCards: 加载数据失败:", error);
        setGmvData({
          total_gmv: 0,
          pop_percentage: 0,
          trend: "up",
          error: String(error)
        });
        setSalesData({
          total_sales: 0,
          pop_percentage: 0,
          trend: "up",
          error: String(error)
        });
        setStoresData({
          total_stores: 0,
          added: 0,
          removed: 0,
          net_change: 0,
          trend: "up",
          error: String(error)
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [dateRange]);

  // if (!gmvData || !salesData || !storesData) {
  //   return (
  //     // <div className="flex w-full h-[200px] items-center justify-center">
  //     //   <Loading size="lg" />
  //     // </div>
  //     <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
  //   );
  // }

  // const formattedGMV = new Intl.NumberFormat('en-US', {
  //   style: 'currency',
  //   currency: 'CNY',
  //   minimumFractionDigits: 2,
  //   maximumFractionDigits: 2
  // }).format(gmvData.total_gmv);

  const formattedGMV = `¥${gmvData.total_gmv.toLocaleString()}`;

  const formatPercentage = (pop_percentage: number | string): string => {
    if (typeof pop_percentage === "number") {
      return `${pop_percentage > 0 ? "+" : ""}${pop_percentage}%`;
    }
    return "--";
  };

  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-6 [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total GMV</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              formattedGMV
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {gmvData.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(gmvData.pop_percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {gmvData.trend === 'up' ? (
              <>Trending up {formatPercentage(gmvData.pop_percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(gmvData.pop_percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
          {gmvData.error && (
            <div className="text-red-500 text-xs">Error: {gmvData.error}</div>
          )}
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total Sales</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              salesData.total_sales
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {salesData.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(salesData.pop_percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {salesData.trend === 'up' ? (
              <>Trending up {formatPercentage(salesData.pop_percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(salesData.pop_percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
          {salesData.error && (
            <div className="text-red-500 text-xs">Error: {salesData.error}</div>
          )}
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total Stores</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              storesData.total_stores
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {storesData.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {storesData.net_change >= 0 ? `+${storesData.net_change}` : storesData.net_change}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
            {storesData.added >= 0 && storesData.removed === 0 ? (
              <>
                Added {storesData.added} stores
                <IconTrendingUp className="size-4 " />
              </>
            ) : storesData.removed > 0 && storesData.added === 0 ? (
              <>
                Removed {storesData.removed} stores
                <IconTrendingDown className="size-4 " />
              </>
            ) : (
              <div className="flex gap-2">
              <>
                Added {storesData.added} stores
                <IconTrendingUp className="size-4 " />
              </>
              <div className="flex gap-2">
                Removed {storesData.removed} stores 
                <IconTrendingDown className="size-4 " />
              </div>
                Net change of {storesData.net_change} stores 
                {storesData.net_change >= 0 ? (
                  <IconTrendingUp className="size-4 " />
                ) : (
                  <IconTrendingDown className="size-4 " />
                )}
              </div>
            )}
          </div>
          {storesData.error && (
            <div className="text-red-500 text-xs">Error: {storesData.error}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}