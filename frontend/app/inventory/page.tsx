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

  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const result = await fetchStores();
      return [{ id: 'all', name: 'All Stores' }, ...result.map((store: any) => ({
        id: store.store_id.toString(),
        name: store.store_name,
      }))];
    },
    placeholderData: [{ id: 'all', name: 'All Stores' }],
  });

  const stores = storesData ?? [{ id: 'all', name: 'All Stores' }];

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
            <InventoryViewContext.Provider value={{ viewMode, storeId, setViewMode, setStoreId, stores, isLoading }}>
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
      </SidebarInset>
    </SidebarProvider>
  );
}