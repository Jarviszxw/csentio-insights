"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SettlementFilter, SettlementViewContext } from "@/components/settlement-filter"
import { SettlementStatistics } from "@/components/settlement-statistics"
import { SettlementProductChart } from "@/components/settlement-product-chart"
import { SettlementRecordsTable } from "@/components/settlement-records-table"
import { useState } from "react"

// 创建一个Settlement视图模式提供组件
function SettlementViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<"total" | "by-store">("total")
  const [storeId, setStoreId] = useState("all")

  return (
    <SettlementViewContext.Provider value={{ viewMode, storeId, setViewMode, setStoreId }}>
      {children}
    </SettlementViewContext.Provider>
  )
}

export default function SettlementPage() {
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
        <SettlementViewProvider>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
                <SettlementFilter />
              </div>
              <div className="flex flex-col gap-4 py-4 md:gap-4 md:py-2">
                <div className="px-4 lg:px-6">
                  <SettlementStatistics />
                </div>
                <div className="px-4 lg:px-6">
                  <SettlementProductChart />
                </div>
                <div className="px-4 lg:px-6">
                  <SettlementRecordsTable />
                </div>
              </div>
            </div>
          </div>
        </SettlementViewProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
