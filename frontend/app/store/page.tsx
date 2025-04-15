"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { StoreTabs } from "./tabs";
import { StoreViewProvider } from "@/components/store-context";

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
        <StoreViewProvider>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
                <StoreTabs />
              </div>
            </div>
          </div>
        </StoreViewProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}