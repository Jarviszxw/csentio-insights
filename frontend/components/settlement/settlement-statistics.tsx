// settlement-statistics.tsx
"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "../date-range-context";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { API_BASE_URL, fetchTotalGMV, fetchTotalSales } from "@/lib/api";
import { formatDateToISOString } from "@/lib/utils";
import { useSettlementView } from './settlement-filter';
import React from "react";

type MetricData = {
  value: number;
  percentage: number;
  trend: "up" | "down";
};

export function SettlementStatistics() {
  const { dateRange } = useDateRange();
  const { viewMode, storeId, stores } = useSettlementView();

  const [gmvData, setGmvData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [salesData, setSalesData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Statistics: Fetching data...");
      setLoading(true);
      try {
        // Fetch GMV data
        const gmvResponse = await fetchTotalGMV(dateRange?.from, dateRange?.to, storeId);
        if (gmvResponse.error) throw new Error(gmvResponse.error);
        setGmvData({
          value: gmvResponse.total_gmv || 0,
          percentage: typeof gmvResponse.pop_percentage === 'number' ? gmvResponse.pop_percentage : 0,
          trend: gmvResponse.trend || "up",
        });

        // Fetch Sales data
        const salesResponse = await fetchTotalSales(dateRange?.from, dateRange?.to, storeId);
        if (salesResponse.error) throw new Error(salesResponse.error);
        setSalesData({
          value: salesResponse.total_sales || 0,
          percentage: typeof salesResponse.pop_percentage === 'number' ? salesResponse.pop_percentage : 0,
          trend: salesResponse.trend || "up",
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    // Simple logic: fetch data whenever dateRange or storeId changes.
    // The backend handles the case where storeId is 'all'.
    console.log(`Statistics: useEffect triggered/fetching. storeId: ${storeId}, dateRange:`, dateRange);
    fetchData();

  // Dependencies: trigger effect when dateRange or storeId changes
  }, [dateRange, storeId]);

  const formatPercentage = (percentage: number): string => {
    return `${percentage > 0 ? "+" : ""}${percentage}%`;
  };

  const formattedGMV = `¥${gmvData.value.toLocaleString()}`;
  const formattedSales = salesData.value.toLocaleString();

  // Determine card title based on viewMode and storeId
  const getStoreName = (id: string) => stores.find(s => String(s.store_id) === id)?.store_name || `Store ${id}`;
  const gmvTitle = viewMode === 'by-store' && storeId !== 'all' ? `${getStoreName(storeId)} GMV` : 'Total GMV';
  const salesTitle = viewMode === 'by-store' && storeId !== 'all' ? `${getStoreName(storeId)} Sales` : 'Total Sales';

  return (
    <div className="flex w-full gap-4 overflow-x-auto [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">{gmvTitle}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {loading ? (
              <div className="mt-2 h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              formattedGMV
            )}
          </CardTitle>
          <Badge variant="outline" className="border-none">
            {gmvData.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
            {formatPercentage(gmvData.percentage)}
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {gmvData.trend === "up" ? (
              <>
                Trending up {formatPercentage(gmvData.percentage)} this period{" "}
                <IconTrendingUp className="size-4" />
              </>
            ) : (
              <>
                Down {formatPercentage(gmvData.percentage)} this period{" "}
                <IconTrendingDown className="size-4" />
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">{salesTitle}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {loading ? (
              <div className="mt-2 h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              formattedSales
            )}
          </CardTitle>
          <Badge variant="outline" className="border-none">
            {salesData.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
            {formatPercentage(salesData.percentage)}
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {salesData.trend === "up" ? (
              <>
                Trending up {formatPercentage(salesData.percentage)} this period{" "}
                <IconTrendingUp className="size-4" />
              </>
            ) : (
              <>
                Down {formatPercentage(salesData.percentage)} this period{" "}
                <IconTrendingDown className="size-4" />
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}