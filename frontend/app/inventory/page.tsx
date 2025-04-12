import { AppSidebar } from "@/components/app-sidebar";
import { InventoryActions } from "@/components/inventory-actions";
import { InventoryFilter } from "@/components/inventory-filter";
import { InventoryRecordsTable } from "@/components/inventory-records-table";
import { InventorySample } from "@/components/inventory-sample";
import { InventoryScatterChart } from "@/components/inventory-scatter-chart";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"; 


export default function InventoryPage() {
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
            <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
              <h1 className="text-lg font-semibold">Inventory</h1>
              <div className="flex items-center gap-2">
                <InventoryFilter />
                
              </div>
            </div>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <InventorySample />
              <div className="px-4 lg:px-6">
                <InventoryScatterChart />
              </div>
              <div className="px-4 lg:px-6">
                <InventoryRecordsTable />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}