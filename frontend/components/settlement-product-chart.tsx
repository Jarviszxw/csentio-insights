"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettlementView } from "./settlement-filter"; // Adjust path as needed
import { API_BASE_URL } from "@/lib/api";

interface ProductData {
  name: string;
  sales: number;
}

export function SettlementProductChart() {
  const { viewMode, storeId } = useSettlementView();
  const [productData, setProductData] = React.useState<ProductData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/settlements/products`;
        if (viewMode === "by-store" && storeId !== "all") {
          url += `?store_id=${storeId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch product data");
        const data = await response.json();
        setProductData(data);
      } catch (error) {
        console.error("Error fetching product data:", error);
        setProductData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [viewMode, storeId]);

  const barColor = "hsl(171, 70%, 45%)"; // Teal color from shadcn/ui

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
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis axisLine={false} tickLine={false} tickCount={7} domain={[0, "auto"]} hide />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    backgroundColor: "var(--background)",
                  }}
                  formatter={(value: number) => [`${value}`, "Quantity"]}
                  labelFormatter={(value) => `Product: ${value}`}
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