"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SettlementFilter, SettlementViewProvider } from "@/components/settlement-filter"
import { SettlementStatistics } from "@/components/settlement-statistics"
import { SettlementProductChart } from "@/components/settlement-product-chart"
import { SettlementRecordsTable } from "@/components/settlement-records-table"

import React from "react"

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
                <div className="px-4 lg:px-6 mt-[-69px]">
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
