"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, eachMonthOfInterval } from "date-fns";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDateRange } from "@/components/date-range-context";
import { MonthlyDataItem, fetchMonthlyData } from "@/lib/api";
import { Loading } from "@/components/ui/loading";

interface ChartData {
  date: string;
  gmv: number;
  sales: number;
}

const defaultChartData: ChartData[] = [
  { date: "2025-01-01", gmv: 300, sales: 200 },
  { date: "2025-02-01", gmv: 400, sales: 250 },
  { date: "2025-03-01", gmv: 350, sales: 220 },
  { date: "2025-04-01", gmv: 380, sales: 230 },
  { date: "2025-05-01", gmv: 165, sales: 220 },
  { date: "2025-06-01", gmv: 446, sales: 400 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  gmv: {
    label: "GMV",
    color: "hsl(142, 71%, 45%)",
  },
  sales: {
    label: "Sales",
    color: "hsl(0, 72%, 51%)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { dateRange } = useDateRange();
  const [chartData, setChartData] = React.useState<ChartData[]>(defaultChartData);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const from = dateRange?.from ?? new Date(new Date().getFullYear(), 0, 1);
        const to = dateRange?.to ?? new Date();
        
        console.log("ChartAreaInteractive: 获取月度数据，日期范围:", { from, to });
        const data = await fetchMonthlyData(from, to);
        
        const allMonths = eachMonthOfInterval({ start: from, end: to })
          .map(date => format(date, "yyyy-MM-dd"));
          
        const monthDataMap: Record<string, { gmv: number, sales: number }> = {};
        if (data && data.length > 0) {
          data.forEach(item => {
            const monthKey = format(new Date(item.date), "yyyy-MM-dd");
            monthDataMap[monthKey] = {
              gmv: Number(item.gmv) || 0,
              sales: Number(item.sales) || 0
            };
          });
        }
        
        const completeData: ChartData[] = allMonths.map(monthKey => ({
          date: monthKey,
          gmv: monthDataMap[monthKey]?.gmv || 0,
          sales: monthDataMap[monthKey]?.sales || 0
        }));
        
        if (completeData.length > 0) {
          setChartData(completeData);
        } else {
          console.warn("没有获取到月度数据，使用默认数据");
          setChartData(defaultChartData);
        }
      } catch (error) {
        console.error("获取月度数据失败:", error);
        setChartData(defaultChartData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dateRange]);

  const maxGMV = Math.max(...chartData.map(item => item.gmv));
  const maxSales = Math.max(...chartData.map(item => item.sales));
  
  const salesScaleFactor = 50;

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="text-base font-semibold tabular-nums text-foreground">
            Monthly GMV / Sales
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center">
            <Loading size="lg" />
          </div>
        ) : (
          <ChartContainer 
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart 
              data={chartData}
              margin={{ left: 10, right: 10, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillGMV" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.gmv.color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.gmv.color}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.sales.color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.sales.color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={8}
                padding={{ left: 20, right: 20 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return format(date, "MMM");
                }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value}
                domain={[0, 'auto']}
                hide
              />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : chartData.length > 10 ? 10 : chartData.length - 1}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return format(new Date(value), "MMM yyyy");
                    }}
                    formatter={(value, name, props) => {
                      if (name === "GMV") {
                        return [`$${value.toLocaleString()}`, "GMV"];
                      }
                      if (name === "Sales") {
                        return [props.payload.sales.toLocaleString(), "Sales"];
                      }
                      return [value.toLocaleString(), name];
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="gmv"
                type="monotone"
                fill="url(#fillGMV)"
                stroke={chartConfig.gmv.color}
                strokeWidth={2}
                name="GMV"
              />
              <Area
                dataKey="salesScaled"
                type="monotone"
                fill="url(#fillSales)"
                stroke={chartConfig.sales.color}
                strokeWidth={2}
                name="Sales"
                data={chartData.map(item => ({
                  ...item,
                  salesScaled: item.sales * salesScaleFactor
                }))}
              />   
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}