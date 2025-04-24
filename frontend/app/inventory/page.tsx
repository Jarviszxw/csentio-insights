'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppSidebar } from "@/components/app-sidebar";
import { InventoryFilter, InventoryViewContext, ViewMode } from "@/components/inventory-filter"; // 导入 InventoryViewContext 和 ViewMode
import { InventoryRecordsTable } from "@/components/inventory-records-table";
import { InventoryStatistics } from "@/components/inventory-statistics";
import { InventoryScatterChart } from "@/components/inventory-scatter-chart";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { fetchStores, StoresInfo } from '@/lib/api'; // 导入 fetchStores 和 StoresInfo

export default function InventoryPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("total");
  const [storeId, setStoreId] = React.useState("all");

  const { data: storesData, isLoading: isStoresLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const result = await fetchStores();
      // Ensure store_id is string
      return [{ id: 'all', name: 'All Stores' }, ...result.map((store: any) => ({
        id: String(store.store_id), // Explicitly convert to string
        name: store.store_name,
      }))];
    },
    placeholderData: [{ id: 'all', name: 'All Stores' }],
    // Add staleTime and gcTime to potentially stabilize this query
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes 
  });

  const stores = storesData ?? [{ id: 'all', name: 'All Stores' }];

  // Create the context value - DO NOT pass isStoresLoading directly for now
  const contextValue = React.useMemo(() => ({
    viewMode,
    storeId,
    setViewMode,
    setStoreId,
    stores,
    isLoading: false, // Hardcode to false for testing
  }), [viewMode, storeId, stores]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 55)",
          "--header-height": "calc(var(--spacing) * 10)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* Pass the memoized context value */}
            <InventoryViewContext.Provider value={contextValue}>
              <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
                {/* Let InventoryFilter use the isLoading from context (now false) */}
                <InventoryFilter />
              </div>
              <div className="flex flex-col gap-4 py-4 md:gap-1 md:py-2">
                <div className="px-4 lg:px-6">
                  {/* These components fetch their own data */}
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
      </SidebarInset>
    </SidebarProvider>
  );
}