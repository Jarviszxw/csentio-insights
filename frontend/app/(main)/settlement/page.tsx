"use client";

import { SettlementFilter, SettlementViewProvider } from "@/components/settlement/settlement-filter"
import { SettlementStatistics } from "@/components/settlement/settlement-statistics"
import { SettlementProductChart } from "@/components/settlement/settlement-product-chart"
import { SettlementRecordsTable } from "@/components/settlement/settlement-records-table"

import React from "react"

export default function SettlementPage() {
  return (
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
  )
}
