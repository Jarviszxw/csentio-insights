"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useSettlementView } from "./settlement-filter";

// 定义产品数据类型
interface ProductData {
  name: string;
  sales: number;
  gmv: number;
}

// 按店铺分类的模拟产品销售数据
const mockStoreProductData: Record<string, ProductData[]> = {
  "store-a": [
    { name: "SK-001", sales: 80, gmv: 8000 },
    { name: "SK-002", sales: 45, gmv: 4500 },
    { name: "SK-003", sales: 30, gmv: 3000 },
    { name: "SK-004", sales: 15, gmv: 1500 },
  ],
  "store-b": [
    { name: "SK-001", sales: 25, gmv: 2500 },
    { name: "SK-002", sales: 30, gmv: 3000 },
    { name: "SK-005", sales: 60, gmv: 6000 },
    { name: "SK-006", sales: 45, gmv: 4500 },
  ],
  "store-c": [
    { name: "SK-003", sales: 34, gmv: 3400 },
    { name: "SK-004", sales: 22, gmv: 2200 },
    { name: "SK-007", sales: 55, gmv: 5500 },
    { name: "SK-008", sales: 128, gmv: 12800 },
  ],
};

// 模拟产品销售数据
const mockProductData: ProductData[] = [
  { name: "SK-001", sales: 120, gmv: 12000 },
  { name: "SK-002", sales: 85, gmv: 8500 },
  { name: "SK-003", sales: 64, gmv: 6400 },
  { name: "SK-004", sales: 37, gmv: 3700 },
  { name: "SK-005", sales: 93, gmv: 9300 },
  { name: "SK-006", sales: 72, gmv: 7200 },
  { name: "SK-007", sales: 55, gmv: 5500 },
  { name: "SK-008", sales: 128, gmv: 12800 },
  { name: "SK-009", sales: 47, gmv: 4700 },
  { name: "SK-010", sales: 106, gmv: 10600 },
];

export function SettlementProductChart() {
  // 使用视图模式Context
  const { viewMode, storeId } = useSettlementView();
  const { theme } = useTheme();

  // 根据视图模式和选择的店铺选择数据
  const productData = React.useMemo(() => {
    if (viewMode === "by-store" && storeId !== "all") {
      return mockStoreProductData[storeId] || [];
    }
    return mockProductData;
  }, [viewMode, storeId]);
  
  // 计算总销量和总GMV
  const totalSales = productData.reduce((sum: number, item: ProductData) => sum + item.sales, 0);
  const totalGMV = productData.reduce((sum: number, item: ProductData) => sum + item.gmv, 0);
  
  // 根据主题设置颜色
  const barColor = "hsl(171, 70%, 45%)"; // shadcn/ui teal color

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {viewMode === "by-store" && storeId !== "all"
            ? `Sales by Product (${storeId.replace("store-", "Store ")})`
            : "Sales by Product"}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total GMV: <span className="font-medium">¥{totalGMV.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 50,
              }}
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
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickCount={7}
                domain={[0, 'auto']}
                hide={true}
              />
              <Tooltip 
                cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                }}
                formatter={(value, name) => {
                  if (name === "sales") return [`${value}`, 'Quantity'];
                  if (name === "gmv") return [`¥${value}`, 'GMV'];
                  return [value, name];
                }}
                labelFormatter={(value) => `Product: ${value}`}
              />
              <Bar 
                dataKey="sales" 
                fill={barColor}
                radius={[4, 4, 0, 0]}
                barSize={30}
                name="Sales"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 