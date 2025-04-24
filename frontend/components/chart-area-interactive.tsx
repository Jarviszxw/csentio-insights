"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

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
import { Loading } from "@/components/ui/loading";

interface ChartData {
  date: string;
  gmv: number;
  sales: number;
}

interface ChartAreaInteractiveProps {
  chartData: ChartData[];
  isLoading: boolean;
}

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

export function ChartAreaInteractive({ chartData, isLoading }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  
  const salesScaleFactor = 50;

  const displayData = chartData && chartData.length > 0 ? chartData : [];

  return (
    <Card className="@container/card overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="text-base font-semibold tabular-nums text-foreground">
            Monthly GMV / Sales
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="aspect-auto h-[250px] flex items-center justify-center">
            <Loading size="lg" />
          </div>
        ) : (
          <ChartContainer 
            config={chartConfig}
            className="aspect-auto h-[250px]"
          >
            <AreaChart
              data={displayData}
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
                  try {
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? "" : format(date, "MMM");
                  } catch (e) {
                    return "";
                  }
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
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), "MMM yyyy");
                      } catch (e) {
                        return "Invalid Date";
                      }
                    }}
                    formatter={(value, name, props) => {
                      if (name === "GMV") {
                        return [`¥${Number(value).toLocaleString()}`, "GMV"];
                      }
                      if (name === "Sales") {
                        const salesVal = props?.payload?.sales;
                        return [typeof salesVal === 'number' ? salesVal.toLocaleString() : 'N/A', "Sales"];
                      }
                      return [Number(value).toLocaleString(), name];
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
                data={displayData.map(item => ({
                  ...item,
                  salesScaled: (item.sales || 0) * salesScaleFactor
                }))}
              />   
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}