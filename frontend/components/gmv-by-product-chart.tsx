"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { useDateRange } from "@/components/date-range-context";
import { DimensionDataItem, fetchGMVByDimension } from "@/lib/api";

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
import { Loading } from "@/components/ui/loading";

interface ChartData {
  product: string;
  gmv: number;
  trend: number;
}

interface GMVByProductChartProps {
  externalData?: DimensionDataItem[];
  skipLoading?: boolean;
}

// Default data for when API requests fail
const defaultChartData: ChartData[] = [
  { product: "Product A", gmv: 520, trend: 2.5 },
  { product: "Product B", gmv: 460, trend: -1.2 },
  { product: "Product C", gmv: 400, trend: 0.7 },
  { product: "Product D", gmv: 350, trend: -0.3 },
  { product: "Product E", gmv: 300, trend: 1.8 },
  { product: "Product F", gmv: 260, trend: -1.4 },
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

export function GMVByProductChart({ externalData, skipLoading = false }: GMVByProductChartProps) {
  const { dateRange } = useDateRange();
  const [chartData, setChartData] = React.useState<ChartData[]>(defaultChartData);
  const [isLoading, setIsLoading] = React.useState(false);

  // 使用外部数据，如果提供的话
  React.useEffect(() => {
    if (externalData && externalData.length > 0) {
      const mappedData: ChartData[] = externalData.map(item => ({
        product: item.product || String(item.name) || 'Unknown',
        gmv: Number(item.gmv) || 0,
        trend: typeof item.trend === 'number' ? item.trend : 0
      }));
      setChartData(mappedData);
    }
  }, [externalData]);

  // 仅在没有外部数据时获取数据
  React.useEffect(() => {
    if (skipLoading || externalData) {
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const from = dateRange?.from ?? undefined;
        const to = dateRange?.to ?? undefined;
        
        console.log("GMVByProductChart: 获取产品GMV数据，日期范围:", { from, to });
        const data = await fetchGMVByDimension('product', from, to, 6);
        
        if (data && data.length > 0) {
          // Map API response data to component format
          const mappedData: ChartData[] = data.map(item => ({
            product: item.product || String(item.name) || 'Unknown',
            gmv: Number(item.gmv) || 0,
            trend: typeof item.trend === 'number' ? item.trend : 0
          }));
          setChartData(mappedData);
        } else {
          console.warn("没有获取到产品GMV数据，使用默认数据");
          setChartData(defaultChartData);
        }
      } catch (error) {
        console.error("获取产品GMV数据失败:", error);
        setChartData(defaultChartData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dateRange, skipLoading, externalData]);

  // 环比趋势格式化
  const formatTrend = (value: number) => {
    if (typeof value !== 'number') return '';
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  // 本地loading状态，在skipLoading为true时忽略
  const showLoading = !skipLoading && isLoading;

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GMV by Product</CardTitle>
        </div>
        <CardDescription>
        {dateRange?.from && dateRange?.to ? (
                  dateRange.from.getFullYear() === dateRange.to.getFullYear() ? (
                    <>{format(dateRange.from, "MMM")} - {format(dateRange.to, "MMM yyyy")}</>
                  ) : (
                    <>{format(dateRange.from, "MMM yyyy")} - {format(dateRange.to, "MMM yyyy")}</>
                  )
                ) : (
                  <>{format(new Date(), "MMM yyyy")}</>
                )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loading size="lg" />
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
                dataKey="product"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 6)}
                hide
              />
              <XAxis dataKey="gmv" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  indicator="line" 
                  formatter={(value, name, props) => {
                    return [`$${value.toLocaleString()}`, "GMV"];
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
                  dataKey="product"
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