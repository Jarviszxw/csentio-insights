// settlement-statistics.tsx
"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "./date-range-context";
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
import { API_BASE_URL } from "@/lib/api";
import { formatDateToISOString } from "@/lib/utils";

type MetricData = {
  value: number;
  percentage: number;
  trend: "up" | "down";
};

export function SettlementStatistics() {
  const { dateRange } = useDateRange();
  const [gmvData, setGmvData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [salesData, setSalesData] = useState<MetricData>({ value: 0, percentage: 0, trend: "up" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateRange?.from) {
          params.append("start_date", formatDateToISOString(dateRange.from));
        }
        if (dateRange?.to) {
          params.append("end_date", formatDateToISOString(dateRange.to));
        }

        // Fetch GMV data
        const gmvResponse = await fetch(`${API_BASE_URL}/metrics/total-gmv?${params.toString()}`);
        if (!gmvResponse.ok) throw new Error("Failed to fetch GMV data");
        const gmvResult = await gmvResponse.json();
        setGmvData({
          value: gmvResult.total_gmv || 0,
          percentage: gmvResult.pop_percentage || 0,
          trend: gmvResult.trend || "up",
        });

        // Fetch Sales data
        const salesResponse = await fetch(`${API_BASE_URL}/metrics/total-sales?${params.toString()}`);
        if (!salesResponse.ok) throw new Error("Failed to fetch Sales data");
        const salesResult = await salesResponse.json();
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
    fetchData();
  }, [dateRange]);

  const formatPercentage = (percentage: number): string => {
    return `${percentage > 0 ? "+" : ""}${percentage}%`;
  };

  const formattedGMV = `¥${gmvData.value.toLocaleString()}`;
  const formattedSales = salesData.value.toLocaleString();

  return (
    <div className="flex w-full gap-4 overflow-x-auto [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total GMV</CardDescription>
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
          <CardDescription className="text-l font-semibold tabular-nums">Total Sales</CardDescription>
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