import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { StoreMap } from "@/components/store-map";

export default function StorePage() {
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
              <h1 className="text-lg font-semibold">Stores</h1>
            </div>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <StoreMap />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}