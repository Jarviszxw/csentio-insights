// settlement-product-chart.tsx
"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettlementView } from "./settlement-filter";
import { useDateRange } from "./date-range-context";
import { formatDateToISOString } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

interface ProductData {
  name: string;
  sales: number;
}

export function SettlementProductChart() {
  const { viewMode, storeId } = useSettlementView();
  const { dateRange } = useDateRange();
  const [productData, setProductData] = React.useState<ProductData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (viewMode === "by-store" && storeId !== "all") {
          // 将 storeId 转换为整数
          const storeIdNum = parseInt(storeId);
          if (!isNaN(storeIdNum)) {
            params.append("store_id", storeIdNum.toString());
          }
        }
        if (dateRange?.from) {
          params.append("start_date", formatDateToISOString(dateRange.from));
        }
        if (dateRange?.to) {
          params.append("end_date", formatDateToISOString(dateRange.to));
        }

        const url = `${API_BASE_URL}/settlement/products?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch product data: ${response.status} ${errorText}`);
        }
        const data = await response.json();

        const formattedData: ProductData[] = data.map((item: any) => ({
          name: item.sku_name || `Product ${item.product_id}`,
          sales: item.quantity || 0,
        }));

        setProductData(formattedData);
      } catch (error) {
        console.error("Error fetching product data:", error);
        setProductData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [viewMode, storeId, dateRange]);

  const barColor = "hsl(171, 70%, 45%)";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {viewMode === "by-store" && storeId !== "all"
            ? `Sales by Product (Store ${storeId})`
            : "Sales by Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[350px] w-full flex items-center justify-center">
            <p>Loading...</p>
          </div>
        ) : productData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productData}
                margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                <XAxis
                  dataKey="name"
                  height={70}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tickCount={7} domain={[0, "auto"]} hide />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    backgroundColor: "hsl(var(--background))",
                    padding: "var(--spacing-2)"
                  }}
                  formatter={(value: number, name: string, props: any) => [
                     `${value}`,
                     <span key={name} style={{ color: props.color }}>Sales</span>
                  ]}
                  labelFormatter={(label: string) => (
                     <span style={{ fontWeight: 500 }}>{label}</span>
                  )}
                />
                <Bar dataKey="sales" fill={barColor} radius={[4, 4, 0, 0]} barSize={30} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] w-full flex items-center justify-center">
            <p>No sales data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}