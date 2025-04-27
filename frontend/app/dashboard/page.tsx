'use client';

import * as React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/components/date-range-context";
import {  fetchTotalStores, fetchMonthlyData, fetchGMVByDimension, GMVResponse, SalesResponse, StoresResponse, MonthlyDataItem, DimensionDataItem, fetchTotalGMV, fetchTotalSales } from "@/lib/api";

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { GMVByMetrics } from "@/components/dashboard/gmv-by-metrics"
import { format, eachMonthOfInterval } from "date-fns";

export default function Page() {
  const { dateRange } = useDateRange();
  const from = dateRange?.from;
  const to = dateRange?.to;

  const sectionCardQueries = useQueries({
    queries: [
      {
        queryKey: ['totalGmv', from, to],
        queryFn: () => fetchTotalGMV(from, to),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
      {
        queryKey: ['totalSales', from, to],
        queryFn: () => fetchTotalSales(from, to),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
      {
        queryKey: ['totalStores', from, to],
        queryFn: () => fetchTotalStores(from, to),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
    ],
  });

  const gmvQuery = sectionCardQueries[0];
  const salesQuery = sectionCardQueries[1];
  const storesQuery = sectionCardQueries[2];

  const sectionCardsLoading = sectionCardQueries.some(query => query.isLoading);
  const sectionCardsSuccess = sectionCardQueries.every(query => query.isSuccess);

  const gmvData = gmvQuery.data ?? { total_gmv: 0, pop_percentage: 0, trend: "up" };
  const salesData = salesQuery.data ?? { total_sales: 0, pop_percentage: 0, trend: "up" };
  const storesData = storesQuery.data ?? { total_stores: 0, added: 0, removed: 0, net_change: 0, trend: "up" };

  const monthlyDataQuery = useQuery<MonthlyDataItem[], Error>({
    queryKey: ['monthlyData', from, to],
    queryFn: () => fetchMonthlyData(from, to),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: sectionCardsSuccess,
  });

  const chartDataProcessed = React.useMemo(() => {
    const data = monthlyDataQuery.data;
    const startDate = from ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = to ?? new Date();

    if (!monthlyDataQuery.isSuccess || !data) {
      return [];
    }

    try {
        const allMonths = eachMonthOfInterval({ start: startDate, end: endDate })
        .map(date => format(date, "yyyy-MM-dd"));

        const monthDataMap: Record<string, { gmv: number, sales: number }> = {};
        data.forEach(item => {
            const monthKey = format(new Date(item.date), "yyyy-MM-dd");
            monthDataMap[monthKey] = {
            gmv: Number(item.gmv) || 0,
            sales: Number(item.sales) || 0
            };
        });

        const completeData = allMonths.map(monthKey => ({
            date: monthKey,
            gmv: monthDataMap[monthKey]?.gmv || 0,
            sales: monthDataMap[monthKey]?.sales || 0
        }));
        return completeData;
    } catch (error) {
        console.error("Error processing monthly data:", error);
        return [];
    }

  }, [monthlyDataQuery.data, monthlyDataQuery.isSuccess, from, to]);

  const gmvByDimensionQueries = useQueries({
    queries: [
      {
        queryKey: ['gmvByDimension', 'store', from, to],
        queryFn: () => fetchGMVByDimension('store', from, to, 6),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        enabled: monthlyDataQuery.isSuccess,
      },
      {
        queryKey: ['gmvByDimension', 'product', from, to],
        queryFn: () => fetchGMVByDimension('product', from, to, 6),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        enabled: monthlyDataQuery.isSuccess,
      },
      {
        queryKey: ['gmvByDimension', 'city', from, to],
        queryFn: () => fetchGMVByDimension('city', from, to, 6),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        enabled: monthlyDataQuery.isSuccess,
      },
    ]
  });

  const gmvByStoreQuery = gmvByDimensionQueries[0];
  const gmvByProductQuery = gmvByDimensionQueries[1];
  const gmvByCityQuery = gmvByDimensionQueries[2];

  const gmvByMetricsLoading = gmvByDimensionQueries.some(query => query.isLoading);

  const storeData = gmvByStoreQuery.data ?? [];
  const productData = gmvByProductQuery.data ?? [];
  const cityData = gmvByCityQuery.data ?? [];

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards 
                gmvData={gmvData}
                salesData={salesData}
                storesData={storesData}
                isLoading={sectionCardsLoading}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  chartData={chartDataProcessed} 
                  isLoading={monthlyDataQuery.isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-6">
          <GMVByMetrics 
            storeData={storeData}
            productData={productData}
            cityData={cityData}
            isLoading={gmvByMetricsLoading}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
