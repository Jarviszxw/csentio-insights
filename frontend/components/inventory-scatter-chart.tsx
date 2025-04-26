// components/inventory-scatter-chart.tsx
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryStatistics, InventoryStatisticsResponse } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface ProductInventoryData {
  name: string;
  sampleQuantity: number;
  stockQuantity: number;
  totalQuantity: number;
}

const chartConfig = {
  sample: {
    label: "Sample",
    color: "hsl(201, 80.80%, 60.00%)",
  },
  stock: {
    label: "Stock",
    color: "hsl(111, 71%, 45%)",
  },
} satisfies ChartConfig;

const CustomTooltipContent = (props: TooltipProps<number, string>) => {
  const { active, payload, label } = props;

  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductInventoryData;
    return (
      <div className="bg-background border-border rounded-md border p-2 shadow-sm min-w-[180px]">
        <p className="font-medium mb-2 truncate" title={data.name}>{data.name}</p>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-1 rounded-sm"
              style={{ backgroundColor: chartConfig.sample.color }}
            />
            <p className="text-sm text-muted-foreground">
              Sample
            </p>
          </div>
          <span className="font-semibold tabular-nums ml-auto">{data.sampleQuantity.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-1 rounded-sm"
              style={{ backgroundColor: chartConfig.stock.color }}
            />
            <p className="text-sm text-muted-foreground">
              Stock
            </p>
          </div>
          <span className="font-semibold tabular-nums ml-auto">{data.stockQuantity.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return null;
};

export function InventoryScatterChart() {
  const { storeId } = React.useContext(InventoryViewContext);

  const { data: statsData, isLoading } = useQuery<InventoryStatisticsResponse>({
    queryKey: ['inventoryStatistics', storeId],
    queryFn: () => fetchInventoryStatistics(storeId),
  });

  const productData = React.useMemo((): ProductInventoryData[] => {
    if (!statsData) return [];

    const aggregated: { [name: string]: { sample: number; stock: number } } = {};

    statsData.stock.skuDetails.forEach(item => {
      if (!aggregated[item.name]) aggregated[item.name] = { sample: 0, stock: 0 };
      aggregated[item.name].stock += item.quantity;
    });

    statsData.sample.skuDetails.forEach(item => {
      if (!aggregated[item.name]) aggregated[item.name] = { sample: 0, stock: 0 };
      aggregated[item.name].sample += item.quantity;
    });

    return Object.entries(aggregated).map(([name, quantities]) => ({
      name,
      sampleQuantity: quantities.sample,
      stockQuantity: quantities.stock,
      totalQuantity: quantities.sample + quantities.stock,
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

  }, [statsData]);

  const barColor = chartConfig.stock.color;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Inventory Distribution</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "pt-4",
        (isLoading || productData.length === 0) ? "px-2 sm:px-6" : "px-2 sm:px-6 pt-4 sm:pt-6"
      )}>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loading size="md" />
            </div>
          ) : productData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} opacity={0.6} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" textAnchor="middle" height={70} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={24} />
                  <YAxis axisLine={false} tickLine={false} tickCount={7} domain={[0, 'auto']} hide={true} />
                  <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
                  <Bar dataKey="totalQuantity" fill={barColor} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">No inventory distribution data available for the selected store.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}