'use client'; // Keep this for client-side components

import * as React from "react"; // Import React
import { DimensionDataItem } from "@/lib/api"; // Import type
import { GMVByStoreChart } from "@/components/gmv-by-store-chart";
import { GMVByProductChart } from "@/components/gmv-by-product-chart";
import { GMVByCityChart } from "@/components/gmv-by-city-chart";

// --- Start: Define Props Interface ---
interface GMVByMetricsProps {
  storeData: DimensionDataItem[];
  productData: DimensionDataItem[];
  cityData: DimensionDataItem[];
  isLoading: boolean; 
}
// --- End: Define Props Interface ---

// --- Start: Use Props in Component Signature ---
export function GMVByMetrics({ 
  storeData,
  productData,
  cityData,
  isLoading 
}: GMVByMetricsProps) {
// --- End: Use Props in Component Signature ---

  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-0 [&>*]:min-w-[280px] [&>*]:flex-1">
      {/* Pass data and loading state to child charts */}
      {/* Assuming child components will be refactored to accept chartData and isLoading props */}
      {/* Use skipLoading prop to prevent internal fetching in child components */} 
      <GMVByStoreChart chartData={storeData} isLoading={isLoading} skipLoading={true} />
      <GMVByProductChart chartData={productData} isLoading={isLoading} skipLoading={true} />
      <GMVByCityChart chartData={cityData} isLoading={isLoading} skipLoading={true} />
    </div>
  );
}