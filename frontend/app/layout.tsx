import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "./theme-script";
import { DateRangeProvider } from "@/components/date-range-context";
import { Toaster } from "@/components/ui/sonner";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSENTIŌ Insights",
  description: 'CSENTIŌ Insights: A data management dashboard built with Vercel, FastAPI, Next.js, Supabase, and Tailwind.',
  icons: {
    icon: '/BW-2.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeScript /> 
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DateRangeProvider>{children}</DateRangeProvider>
        <Toaster />
      </body>
    </html>
  );
}


