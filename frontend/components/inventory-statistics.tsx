'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryStatistics, InventoryStatisticsResponse } from '@/lib/api';
import { Separator } from '@/components/ui/separator';

// Helper function to format large numbers
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export function InventoryStatistics() {
  const { storeId } = React.useContext(InventoryViewContext);

  const { data, isLoading, refetch } = useQuery<InventoryStatisticsResponse>({
    queryKey: ['inventoryStatistics', storeId],
    queryFn: () => fetchInventoryStatistics(storeId),
  });

  // Refetch when storeId changes
  React.useEffect(() => {
    refetch();
  }, [storeId, refetch]);

  const { sample, stock } = data || {
    sample: { totalQuantity: 0, skuDetails: [] },
    stock: { totalQuantity: 0, skuDetails: [] }
  };

  const renderStatsSection = (
    title: string,
    stats: { totalQuantity: number; skuDetails: { id: number; name: string; quantity: number }[] } | undefined,
    badgeBgClass: string,
    badgeTextClass: string
  ) => {
    if (!stats) {
      return (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg opacity-50">
          <div className="flex flex-col w-full md:w-48 flex-shrink-0 mb-3 md:mb-0">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex flex-wrap gap-2 flex-grow">
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      );
    }
    const skuDetails = stats.skuDetails || [];

    return (
      <div className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg">
        <div className="flex flex-col w-full md:w-48 flex-shrink-0 mb-3 md:mb-0">
          <span className="text-sm text-muted-foreground mb-2">{title}</span>
          <span className="text-3xl font-bold ml-[21px]">{formatNumber(stats.totalQuantity)}</span>
        </div>
        <div className="flex flex-wrap gap-4 flex-grow">
          {skuDetails.length > 0 ? (
            skuDetails.map((sku) => (
              <Badge
                key={sku.id}
                variant="outline"
                className="flex items-center gap-1.5 py-1 px-2.5 text-xs"
              >
                <span className="font-medium" title={sku.name}>{sku.name}</span>
                <span
                  className={`ml-1 rounded-full ${badgeBgClass} ${badgeTextClass} px-2 py-0.5 text-xs font-semibold`}
                >
                  {formatNumber(sku.quantity)}
                </span>
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">No details available</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full border-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Inventory Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <>
            {renderStatsSection('', undefined, '', '')}
            {renderStatsSection('', undefined, '', '')}
          </>
        ) : (
          <>
            {renderStatsSection(
              'Total Sample',
              sample,
              'bg-blue-200',
              'text-blue-800',
            )}
            <Separator />
            {renderStatsSection(
              'Total Stock',
              stock,
              'bg-green-200',
              'text-green-800'
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}