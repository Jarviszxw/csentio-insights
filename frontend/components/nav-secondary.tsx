"use client";

import * as React from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface NavSecondaryItem {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isSwitch?: boolean;
}

interface NavSecondaryProps {
  items: NavSecondaryItem[];
  className?: string;
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  return (
    <SidebarMenu className={className}>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url} className="py-3">
              {item.icon && <item.icon className="w-6 h-6 mr-3" />}
              <span className="text-base">{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}