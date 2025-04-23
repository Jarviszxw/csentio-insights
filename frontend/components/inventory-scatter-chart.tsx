// components/inventory-scatter-chart.tsx
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // 引入 Skeleton
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryDistribution } from '@/lib/api';

export function InventoryScatterChart() {
  const { storeId } = React.useContext(InventoryViewContext);

  const { data: productData = [], isLoading } = useQuery({
    queryKey: ['inventoryDistribution', storeId],
    queryFn: () => fetchInventoryDistribution(storeId),
  });

  const totalQuantity = productData.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const barColor = 'hsl(142, 71%, 45%)';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Inventory Distribution</CardTitle>
          {/* Tooltip remains unchanged */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-1/4" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickCount={7} domain={[0, 'auto']} hide={true} />
                <RechartsTooltip /* ... same props */ />
                <Bar dataKey="quantity" fill={barColor} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}