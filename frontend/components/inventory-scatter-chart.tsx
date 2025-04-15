"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

// 模拟库存数据
const mockProductData = [
  { name: "SK-001", quantity: 120 },
  { name: "SK-002", quantity: 85 },
  { name: "SK-003", quantity: 64 },
  { name: "SK-004", quantity: 37 },
  { name: "SK-005", quantity: 93 },
  { name: "SK-006", quantity: 72 },
  { name: "SK-007", quantity: 55 },
  { name: "SK-008", quantity: 128 },
  { name: "SK-009", quantity: 47 },
  { name: "SK-010", quantity: 106 },
];

export function InventoryScatterChart() {
  // 在实际应用中，应该通过API获取数据
  const [productData, setProductData] = React.useState(mockProductData);
  const { theme } = useTheme();

  // 计算总数量
  const totalQuantity = productData.reduce((sum, item) => sum + item.quantity, 0);
  
  // 根据主题设置颜色
  const barColor = "hsl(142, 71%, 45%)"; // shadcn/ui green color

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Inventory Distribution</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>不包含sample数量</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
              <RechartsTooltip 
                cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                }}
                formatter={(value) => [`${value}`, 'Quantity']}
                labelFormatter={(value) => `Product: ${value}`}
              />
              <Bar 
                dataKey="quantity" 
                fill={barColor}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}