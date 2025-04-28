"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, TooltipProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettlementView } from "./settlement-filter";
import { useDateRange } from "../date-range-context";
import { API_BASE_URL } from "@/lib/api";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Loading } from "@/components/ui/loading";
import { formatDateToISOString } from "@/lib/utils";
import supabase from '@/lib/supabase';

// 自定义 XAxis Tick 组件以实现双行展示
const CustomTick = (props: any) => {
  const { x, y, payload, data } = props;
  const index = payload.index;
  const name = data[index]?.name || "";
  const code = data[index]?.code || "";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={5}
        fontSize={12}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
      >
        {name}
      </text>
      {/* <text
        x={0}
        y={20}
        dy={5}
        fontSize={12}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
      >
        {code}
      </text> */}
    </g>
  );
};

// 自定义 Tooltip 内容以显示绿色竖形标签
const CustomTooltipContent = (props: TooltipProps<number, string>) => {
  const { active, payload, label } = props;

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border-border rounded-md border p-2 shadow-sm min-w-[150px]">
        <p className="font-medium mb-1 truncate" title={data.name}>{data.name}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-1 rounded-sm"
              style={{ backgroundColor: chartConfig.sales.color }}
            />
            <p className="text-sm text-muted-foreground">
              Sales
            </p>
          </div>
          <span className="font-semibold tabular-nums ml-auto">{data.sales.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return null;
};

interface ProductData {
  name: string;
  code: string;
  sales: number;
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(111, 60%, 50%)",
  },
};

// --- Temporarily define fetchWithAuth here for quick fix --- 
// --- Ideally, import from lib/api.ts after exporting it --- 
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    console.log("fetchWithAuth (Chart): Attempting fetch for URL:", url);
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers(options.headers);
    if (session?.access_token) {
        console.log("fetchWithAuth (Chart): Adding Authorization header.");
        headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    // Simplified version for GET
    return fetch(url, { ...options, headers });
}
// --- End Temporary fetchWithAuth ---

export function SettlementProductChart() {
  const { viewMode, storeId } = useSettlementView();
  const { dateRange } = useDateRange();
  const [productData, setProductData] = React.useState<ProductData[]>([]);
  const [loading, setLoading] = React.useState(true);

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return "";
    const fromYear = dateRange.from.getFullYear();
    const toYear = dateRange.to.getFullYear();
    const fromMonth = format(dateRange.from, "MMM");
    const toMonth = format(dateRange.to, "MMM");

    if (fromYear === toYear) {
      return `${fromMonth} - ${toMonth} ${fromYear}`;
    }
    return `${fromMonth} ${fromYear} - ${toMonth} ${toYear}`;
  };

  const fetchProductData = async (currentStoreId: string, currentRange: typeof dateRange) => {
    console.log(`ProductChart: Fetching data for storeId: ${currentStoreId}, dateRange:`, currentRange);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentStoreId && currentStoreId !== "all") {
        const storeIdNum = parseInt(currentStoreId);
        if (!isNaN(storeIdNum)) {
          params.append("store_id", storeIdNum.toString());
        }
      }
      if (currentRange?.from) {
        params.append("start_date", formatDateToISOString(startOfMonth(currentRange.from)));
      }
      if (currentRange?.to) {
        params.append("end_date", formatDateToISOString(endOfMonth(currentRange.to)));
      }

      const url = `${API_BASE_URL}/settlement/products?${params.toString()}`;
      console.log("ProductChart: Fetching URL:", url);
      // Use fetchWithAuth instead of plain fetch
      const response = await fetchWithAuth(url, { method: 'GET' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch product data: ${response.status} ${errorText}`);
      }
      const data = await response.json();

      // Log the raw data received from the API
      console.log("ProductChart: Raw API Response: ", data);

      const formattedData: ProductData[] = data.map((item: any) => ({
        name: item.sku_name || `Product ${item.product_id}`,
        code: item.sku_code || `Code ${item.product_id}`,
        sales: item.quantity || 0,
      }));

      // Log the formatted data before setting state
      console.log("ProductChart: Formatted Data: ", formattedData);

      setProductData(formattedData);
    } catch (error) {
      console.error("Error fetching product data:", error);
      setProductData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    console.log(`ProductChart: useEffect triggered. storeId: ${storeId}, dateRange:`, dateRange);
    fetchProductData(storeId, dateRange);
  }, [storeId, dateRange]);

  return (
    <Card className="@container/card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold tabular-nums text-foreground">
          {`Sales by Product${formatDateRange() ? ` (${formatDateRange()})` : ""}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="aspect-auto h-[300px] flex items-center justify-center">
            <Loading size="md" />
          </div>
        ) : productData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px]"
          >
            <BarChart
              data={productData}
              margin={{ top: 10, right: 10, left: 10, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} opacity={0.6} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={24}
                minTickGap={8}
                padding={{ left: 20, right: 20 }}
                tick={<CustomTick data={productData} />}
                height={60}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
                domain={[0, "auto"]}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltipContent />}
              />
              <Bar
                dataKey="sales"
                fill={chartConfig.sales.color}
                stroke={chartConfig.sales.color}
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                barSize={40}
                name="Sales"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="aspect-auto h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">No sales data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}