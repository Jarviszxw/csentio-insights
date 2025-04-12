"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { format, isWithinInterval } from "date-fns";

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

const chartData = [
  { date: "2025-01-01", desktop: 300, mobile: 200 },
  { date: "2025-02-01", desktop: 400, mobile: 250 },
  { date: "2025-03-01", desktop: 350, mobile: 220 },
  { date: "2025-04-01", desktop: 380, mobile: 230 },
  { date: "2025-05-01", desktop: 165, mobile: 220 },
  { date: "2025-06-01", desktop: 446, mobile: 400 },
  { date: "2025-07-01", desktop: 500, mobile: 450 },
  { date: "2025-08-01", desktop: 420, mobile: 380 },
  { date: "2025-09-01", desktop: 460, mobile: 410 },
  { date: "2025-10-01", desktop: 480, mobile: 430 },
  { date: "2025-11-01", desktop: 440, mobile: 390 },
  { date: "2025-12-01", desktop: 470, mobile: 420 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "GMV",
    color: "hsl(142, 71%, 45%)", // shadcn/ui green (green-500)
  },
  mobile: {
    label: "Sales",
    color: "hsl(0, 72%, 51%)", // shadcn/ui red (red-500)
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { dateRange } = useDateRange();

  const filteredData = chartData.filter((item) => {
    const itemDate = new Date(item.date);
    if (!dateRange?.from || !dateRange?.to) return true;
    return isWithinInterval(itemDate, {
      start: dateRange.from,
      end: dateRange.to,
    });
  });

  return (
    <Card className="@container/card border-none">
      <CardHeader>
        <CardDescription className="text-l font-semibold tabular-nums">
          Monthly GMV / Sales
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={16}
              minTickGap={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return format(date, "MMM");
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return format(new Date(value), "MMM");
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}