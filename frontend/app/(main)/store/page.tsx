"use client";

// Remove layout component imports
// import { AppSidebar } from "@/components/app-sidebar";
// import { SiteHeader } from "@/components/site-header";
// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/ui/sidebar";
import { StoreTabs } from "./tabs";
import { StoreViewProvider } from "@/components/store/store-context";

export default function StorePage() {
  // Remove SidebarProvider, AppSidebar, SidebarInset, SiteHeader wrappers
  return (
    <StoreViewProvider>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex justify-between items-center px-4 pt-4 lg:px-6">
            <StoreTabs />
          </div>
          {/* Add rest of the store page content here if any */}
        </div>
      </div>
    </StoreViewProvider>
  );
}