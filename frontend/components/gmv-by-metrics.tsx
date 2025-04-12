import { GMVByStoreChart } from "@/components/gmv-by-store-chart";
import { GMVByProductChart } from "@/components/gmv-by-product-chart";
import { GMVByCityChart } from "@/components/gmv-by-city-chart";

export function GMVByMetrics() {
  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-0 [&>*]:min-w-[280px] [&>*]:flex-1">
      <GMVByStoreChart />
      <GMVByProductChart />
      <GMVByCityChart />
    </div>
  );
}