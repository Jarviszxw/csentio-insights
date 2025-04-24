"use client";

import * as React from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { useDateRange } from "@/components/date-range-context";
import { DimensionDataItem } from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "./ui/skeleton";

interface ChartData {
  store: string;
  gmv: number;
  trend: number;
}

interface GMVByStoreChartProps {
  chartData: DimensionDataItem[];
  isLoading: boolean;
  skipLoading?: boolean;
}

const chartConfig = {
  gmv: {
    label: "GMV",
    color: "hsl(201, 100%, 81%)",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function GMVByStoreChart({ chartData: rawData, isLoading, skipLoading = false }: GMVByStoreChartProps) {
  const { dateRange } = useDateRange();

  const chartData: ChartData[] = React.useMemo(() => {
    if (!rawData) return [];
    return rawData.map(item => ({
      store: item.store || String(item.name) || 'Unknown',
      gmv: Number(item.gmv) || 0,
      trend: typeof item.trend === 'number' ? item.trend : 0
    }));
  }, [rawData]);

  const formatTrend = (value: number) => {
    if (typeof value !== 'number') return '';
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const showLoading = isLoading;

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GMV by Store</CardTitle>
        </div>
        <CardDescription> 
          {dateRange?.from && dateRange?.to ? (
                  dateRange.from.getFullYear() === dateRange.to.getFullYear() ? (
                    <>{format(dateRange.from, "MMM")} - {format(dateRange.to, "MMM yyyy")}</>
                  ) : (
                    <>{format(dateRange.from, "MMM yyyy")} - {format(dateRange.to, "MMM yyyy")}</>
                  )
                ) : (
                  <>{/* Fallback or loading indicator */}</> 
                )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-[300px]" />
              <Skeleton className="h-16 w-[300px]" />
              <Skeleton className="h-16 w-[300px]" />
            </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} vertical={false} />
              <YAxis
                dataKey="store"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 6)}
                hide
              />
              <XAxis dataKey="gmv" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  indicator="line"
                  formatter={(value, name, props) => {
                      const numValue = Number(value);
                      return !isNaN(numValue) ? [`¥${numValue.toLocaleString()}`, "GMV"] : ["Invalid Data", "GMV"];
                  }}
                  />}
              />
              <Bar
                dataKey="gmv"
                layout="vertical"
                fill="var(--color-gmv)"
                radius={4}
              >
                <LabelList
                  dataKey="store"
                  position="insideLeft"
                  offset={8}
                  className="fill-[--color-label]"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}