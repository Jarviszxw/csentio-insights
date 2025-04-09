"use client";

import { useEffect } from "react";

export function ThemeScript() {
  useEffect(() => {
    // This code runs immediately when the script is loaded
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  return null; // This component doesn't render anything
}