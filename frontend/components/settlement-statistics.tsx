"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "./date-range-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total GMV</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className={`h-4 w-4 ${gmvData.trend === "up" ? "text-green-500" : "text-red-500"}`}
          >
            <path d={gmvData.trend === "up" ? "M7 17l5-5 5 5" : "M7 7l5 5 5-5"} />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">¥{gmvData.value.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {gmvData.percentage > 0 
              ? `+${gmvData.percentage}%` 
              : `${gmvData.percentage}%`} from previous period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className={`h-4 w-4 ${salesData.trend === "up" ? "text-green-500" : "text-red-500"}`}
          >
            <path d={salesData.trend === "up" ? "M7 17l5-5 5 5" : "M7 7l5 5 5-5"} />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesData.value.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {salesData.percentage > 0 
              ? `+${salesData.percentage}%` 
              : `${salesData.percentage}%`} from previous period
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 