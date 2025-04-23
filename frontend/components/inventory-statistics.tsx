'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryStatistics } from '@/lib/api';

export function InventoryStatistics() {
  const { storeId } = React.useContext(InventoryViewContext);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventoryStatistics', storeId],
    queryFn: () => fetchInventoryStatistics(storeId),
  });

  // Refetch when storeId changes
  React.useEffect(() => {
    refetch();
  }, [storeId, refetch]);

  const { sample, inventory } = data || { sample: { totalQuantity: 0, skuDetails: [] }, inventory: { totalQuantity: 0, skuDetails: [] } };

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Inventory Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-1">
        {isLoading ? (
          <>
            <div className="flex items-center">
              <div className="flex flex-col w-48">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <div className="h-px w-full bg-border"></div>
            <div className="flex items-center">
              <div className="flex flex-col w-48">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <div className="flex flex-col w-48">
                <span className="text-sm text-muted-foreground">Total Sample</span>
                <span className="text-2xl font-bold">{sample.totalQuantity}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sample.skuDetails.map((sku: { id: number; name: string; quantity: number }) => (
                  <Badge key={sku.id} variant="outline" className="flex items-center gap-1">
                    <span className="text-m font-medium">{sku.name}</span>
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                      {sku.quantity}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="h-px w-full bg-border"></div>
            <div className="flex items-center">
              <div className="flex flex-col w-48">
                <span className="text-sm text-muted-foreground">Total Inventory</span>
                <span className="text-2xl font-bold">{inventory.totalQuantity}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {inventory.skuDetails.map((sku: { id: number; name: string; quantity: number }) => (
                  <Badge key={sku.id} variant="outline" className="flex items-center gap-1">
                    <span className="text-m font-medium">{sku.name}</span>
                    <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {sku.quantity}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}