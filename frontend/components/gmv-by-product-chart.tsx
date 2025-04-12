"use client";

import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { useDateRange } from "@/components/date-range-context";
import { isWithinInterval } from "date-fns";

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

interface ChartData {
  product: string;
  gmv: number;
  trend?: number;
}

const chartData: ChartData[] = [
  { product: "Product A", gmv: 186, trend: -3.1 },
  { product: "Product B", gmv: 305, trend: 1.5 },
  { product: "Product C", gmv: 237, trend: -2.0 },
  { product: "Product D", gmv: 73, trend: 4.2 },
  { product: "Product E", gmv: 209, trend: -1.8 },
  { product: "Product F", gmv: 214, trend: 2.3 },
];

const chartConfig = {
  gmv: {
    label: "GMV",
    color: "hsl(201, 100%, 81%)", 
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function GMVByProductChart() {
  const { dateRange } = useDateRange();

  const filteredData = chartData; // We'll filter by date if the data includes dates

  const dateRangeText =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM")} - ${format(dateRange.to, "MMM")} ${dateRange.to.getFullYear()}`
      : "January - June 2025";

  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>GMV by Product</CardTitle>
        <CardDescription>{dateRangeText}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={filteredData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} vertical={false}/>
            <YAxis
              dataKey="product"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 8)}
              hide
            />
            <XAxis dataKey="gmv" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="gmv"
              layout="vertical"
              fill="var(--color-gmv)"
              radius={4}
            >
              <LabelList
                dataKey="product"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number, entry?: { payload?: ChartData }) => {
                  const trend = entry?.payload?.trend ?? 0;
                  return (
                    <tspan>
                      {value}{" "}
                      {trend !== 0 && (
                        <tspan
                          className={
                            trend > 0 ? "fill-green-500" : "fill-red-500"
                          }
                        >
                          {trend > 0 ? `+${trend}%` : `${trend}%`}
                        </tspan>
                      )}
                    </tspan>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}