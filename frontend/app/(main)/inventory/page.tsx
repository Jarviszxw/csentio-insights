'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { InventoryFilter, InventoryViewContext, ViewMode } from "@/components/inventory/inventory-filter";
import { InventoryRecordsTable } from "@/components/inventory/inventory-records-table";
import { InventoryStatistics } from "@/components/inventory/inventory-statistics";
import { InventoryScatterChart } from "@/components/inventory/inventory-scatter-chart";
import { fetchStores, StoresInfo } from '@/lib/api';

export default function InventoryPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("total");
  const [storeId, setStoreId] = React.useState("all");

  const { data: storesData, isLoading: isStoresLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    placeholderData: [],
    // Add staleTime and gcTime to potentially stabilize this query
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes 
  });

  const stores: StoresInfo[] = storesData ?? [];

  // Create the context value - DO NOT pass isStoresLoading directly for now
  const contextValue = React.useMemo(() => ({
    viewMode,
    storeId,
    setViewMode,
    setStoreId,
    stores,
    isLoading: isStoresLoading,
  }), [viewMode, storeId, stores, isStoresLoading]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <InventoryViewContext.Provider value={contextValue}>
          <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
            <InventoryFilter />
          </div>
          <div className="flex flex-col gap-4 py-4 md:gap-1 md:py-2">
            <div className="px-4 lg:px-6">
              <InventoryStatistics />
            </div>
            <div className="px-4 lg:px-6 mb-0">
              <InventoryScatterChart />
            </div>
            <div className="px-4 lg:px-6 -mt-16">
              <InventoryRecordsTable />
            </div>
          </div>
        </InventoryViewContext.Provider>
      </div>
    </div>
  );
}