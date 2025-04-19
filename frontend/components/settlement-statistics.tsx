"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "./date-range-context";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MetricData = {
  value: number;
  percentage: number;
  trend: "up" | "down";
};

// 模拟数据
const mockGMVData = {
  total_gmv: 98650,
  pop_percentage: 12.5,
  trend: "up"
};

const mockSalesData = {
  total_sales: 743,
  pop_percentage: 8.2,
  trend: "up"
};

export function SettlementStatistics() {
  const { dateRange } = useDateRange();
  const [gmvData, setGmvData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [salesData, setSalesData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟API请求延迟
    const fetchData = async () => {
      setLoading(true);
      
      // 使用setTimeout模拟API请求时间
      setTimeout(() => {
        try {
          // 使用模拟数据
          setGmvData({
            value: mockGMVData.total_gmv,
            percentage: mockGMVData.pop_percentage,
            trend: mockGMVData.trend as "up" | "down",
          });
          
          setSalesData({
            value: mockSalesData.total_sales,
            percentage: mockSalesData.pop_percentage,
            trend: mockSalesData.trend as "up" | "down",
          });
        } catch (error) {
          console.error("Error setting mock data:", error);
        } finally {
          setLoading(false);
        }
      }, 500); // 延迟500ms以模拟网络请求
    };
    
    fetchData();
    
    // 实际集成API时，可以取消注释下面的代码
    /*
    const fetchDataFromAPI = async () => {
      setLoading(true);
      try {
        // Format dates for API query
        const start = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : "";
        const end = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";
        
        // Fetch GMV data
        const gmvResponse = await fetch(
          `/api/metrics/total-gmv?start_date=${start}&end_date=${end}`
        );
        const gmvResult = await gmvResponse.json();
        
        // Fetch Sales data
        const salesResponse = await fetch(
          `/api/metrics/total-sales?start_date=${start}&end_date=${end}`
        );
        const salesResult = await salesResponse.json();
        
        setGmvData({
          value: gmvResult.total_gmv || 0,
          percentage: gmvResult.pop_percentage || 0,
          trend: gmvResult.trend || "up",
        });
        
        setSalesData({
          value: salesResult.total_sales || 0,
          percentage: salesResult.pop_percentage || 0,
          trend: salesResult.trend || "up",
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    */
  }, [dateRange]);

  const formatPercentage = (percentage: number): string => {
    return `${percentage > 0 ? "+" : ""}${percentage}%`;
  };

  const formattedGMV = `¥${gmvData.value.toLocaleString()}`;

  return (
    <div className="flex w-full gap-4 overflow-x-auto [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total GMV</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {loading ? (
              <div className="mt-2 h-8 w-20 bg-muted animate-pulse rounded"></div>
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
              {formatPercentage(gmvData.percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {gmvData.trend === 'up' ? (
              <>Trending up {formatPercentage(gmvData.percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(gmvData.percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total Sales</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {loading ? (
              <div className="mt-2 h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              salesData.value
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {salesData.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(salesData.percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {salesData.trend === 'up' ? (
              <>Trending up {formatPercentage(salesData.percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(salesData.percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 