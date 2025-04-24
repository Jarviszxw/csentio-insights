"use client";

import React from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { GMVResponse, SalesResponse, StoresResponse } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "./ui/loading";
import { cn } from "@/lib/utils";

interface SectionCardsProps {
  gmvData: GMVResponse;
  salesData: SalesResponse;
  storesData: StoresResponse;
  isLoading: boolean;
}

export function SectionCards({ 
  gmvData,
  salesData,
  storesData,
  isLoading 
}: SectionCardsProps) {
  const formattedGMV = `¥${(gmvData?.total_gmv ?? 0).toLocaleString()}`;

  const formatPercentage = (pop_percentage: number | string | undefined): string => {
    if (typeof pop_percentage === "number") {
      return `${pop_percentage > 0 ? "+" : ""}${pop_percentage}%`;
    }
    return "--";
  };

  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-6 [&>*]:min-w-[280px] [&>*]:flex-1">
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total GMV</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              formattedGMV
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {gmvData?.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(gmvData?.pop_percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {gmvData?.trend === 'up' ? (
              <>Trending up {formatPercentage(gmvData?.pop_percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(gmvData?.pop_percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
          {gmvData?.error && (
            <div className="text-red-500 text-xs">Error: {gmvData.error}</div>
          )}
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-l font-semibold tabular-nums">Total Sales</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              (salesData?.total_sales ?? 0).toLocaleString()
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {salesData?.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(salesData?.pop_percentage)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {salesData?.trend === 'up' ? (
              <>Trending up {formatPercentage(salesData?.pop_percentage)} this period <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down {formatPercentage(salesData?.pop_percentage)} this period <IconTrendingDown className="size-4" /></>
            )}
          </div>
          {salesData?.error && (
            <div className="text-red-500 text-xs">Error: {salesData.error}</div>
          )}
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-l font-semibold tabular-nums">Total Stores</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl h-9">
            {isLoading ? (
              <div className="mt-2 h-10 w-30 bg-muted animate-pulse rounded"></div>
            ) : (
              storesData?.total_stores ?? 0
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-none">
              {storesData?.trend === 'up' ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {(storesData?.net_change ?? 0) >= 0 ? `+${storesData?.net_change ?? 0}` : storesData?.net_change ?? 0}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
            {(storesData?.added ?? 0) > 0 && (storesData?.removed ?? 0) === 0 ? (
              <>
                Added {storesData?.added} stores
                <IconTrendingUp className="size-4 " />
              </>
            ) : (storesData?.removed ?? 0) > 0 && (storesData?.added ?? 0) === 0 ? (
              <>
                Removed {storesData?.removed} stores
                <IconTrendingDown className="size-4 " />
              </>
            ) : (storesData?.added ?? 0) > 0 && (storesData?.removed ?? 0) > 0 ? (
              <div className="flex gap-2 flex-wrap">
                <>
                  Added {storesData?.added} stores
                  <IconTrendingUp className="size-4" />
                </>
                <>
                  Removed {storesData?.removed} stores
                  <IconTrendingDown className="size-4" />
                </>
              </div>
            ) : (
               <>No change</>
            )}
          </div>
          {storesData?.error && (
            <div className="text-red-500 text-xs">Error: {storesData.error}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}