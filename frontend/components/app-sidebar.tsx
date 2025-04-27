"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBrandTabler,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const data = {
  user: {
    name: "CSENTIŌ",
    email: "m@csentio.com",
    avatar: "/BW-2.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "Store",
      url: "/store",
      icon: IconChartBar,
      isActive: false,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: IconDatabase,
      isActive: true,
    },
    {
      title: "Settlement",
      url: "/settlement",
      icon: IconFolder,
      isActive: false,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [

  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Initialize with a default value (false) to avoid SSR issues
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Update the state on the client side after mounting
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    // Optional: Listen for theme changes (if the theme can change dynamically)
    const observer = new MutationObserver(() => {
      const newIsDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(newIsDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Define the logo image based on the theme
  const logoSrc = isDarkMode ? "/WW-1.png" : "/BW-1.png";
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {/* <a href="https://www.instagram.com/officialcsentio/">
                <img src="/BW-1.png" alt="CSENTIŌ Logo" className="w-30 h-30 mr-2" />
                <span className="text-base font-semibold"></span>
              </a> */}
            
              <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                <a
                  href="https://www.instagram.com/officialcsentio/"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="dark:text-foreground"
                >
                  <img src={logoSrc} alt="CSENTIŌ Logo" className="w-30 h-30 mr-12.5" />
                </a>
              </Button>

            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}