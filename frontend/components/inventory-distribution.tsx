'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryDistribution, fetchProducts, Product, DistributionItem } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartDataItem {
  quantity: number;
  name: string;
  code: string;
  fill?: string;
}

// Tooltip Content - Re-verified
const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: ChartDataItem | undefined = payload[0].payload;
    if (!data) return null;
    const barColor = payload[0].fill || 'hsl(var(--primary))';
    return (
      <div className={cn(
        "rounded-lg border bg-background text-foreground shadow-sm",
        "p-3 min-w-[250px] text-sm"
      )}>
        <div className="mb-2 font-semibold leading-tight break-words">
          {data.name}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Code</span>
            <span className="text-xs font-mono text-muted-foreground">{data.code}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
             <div className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColor }}></span> 
                 <span className="text-xs text-muted-foreground">Quantity</span>
             </div>
            <span className="font-medium">
              {data.quantity?.toLocaleString() ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function InventoryDistribution() {
  const { storeId } = React.useContext(InventoryViewContext);

  const { data: distributionData = [], isLoading: distributionLoading, refetch } = useQuery<DistributionItem[]>({
    queryKey: ['inventoryDistribution', storeId],
    queryFn: () => fetchInventoryDistribution(storeId),
    enabled: storeId === 'all',
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: storeId === 'all',
  });

  React.useEffect(() => {
    if (storeId === 'all') {
      refetch();
    }
  }, [storeId]);

  if (storeId !== 'all') {
    return null;
  }

  const productCodeMap = React.useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.code] = product;
      return acc;
    }, {} as Record<string, Product>);
  }, [products]);

  const chartData: ChartDataItem[] = React.useMemo(() => {
    const primaryFill = 'hsl(var(--primary))';
    return distributionData.map(item => {
      const product = productCodeMap[item.name];
      return {
        quantity: item.quantity,
        name: product?.name || `(Code Only)`,
        code: item.name,
        fill: primaryFill,
      };
    });
  }, [distributionData, productCodeMap]);

  const isLoading = (distributionLoading || productsLoading) && storeId === 'all';

  const formatXAxisTick = (code: string): string => {
    const product = productCodeMap[code];
    return product ? `${product.name}\n(${code})` : code;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Stock Distribution (All Stores)</CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Excludes sample quantity</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs text-muted-foreground text-right pt-1">
          Note: Stacked view per store requires backend changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No stock distribution data available for all stores.
            </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="code"
                interval={0}
                tickFormatter={formatXAxisTick}
                height={90}
                axisLine={false}
                tickLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
                allowDecimals={false}
                width={45}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
                content={<CustomTooltipContent />}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
} 