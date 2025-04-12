"use client";
import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DatePickerWithRange } from "./date-range-picker";
import { useDateRange } from "@/components/date-range-context";

export function SiteHeader() {
 
  // Initialize with a default value (false) to avoid SSR issues
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const { dateRange, setDateRange } = useDateRange();

  // Update the state on the client side after mounting
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className="border-none flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {/* <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        /> */}
        <h1 className="text-base font-medium mx-6">Data Insights</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://www.instagram.com/officialcsentio/"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              officialcsentio
            </a>
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

      </div>
    </header>
  )
}
