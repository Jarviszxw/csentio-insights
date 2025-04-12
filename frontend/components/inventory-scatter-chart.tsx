"use client";

import { Scatter, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ScatterData {
  product: string;
  quantity: number;
  x: number; // For scatter plot positioning
  y: number; // For scatter plot positioning
}

const scatterData: ScatterData[] = [
  { product: "Product A", quantity: 150, x: 1, y: 150 },
  { product: "Product B", quantity: 200, x: 2, y: 200 },
  { product: "Product C", quantity: 100, x: 3, y: 100 },
  { product: "Product D", quantity: 50, x: 4, y: 50 },
];

const chartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(201, 100%, 81%)", // shadcn/ui light blue
  },
} satisfies ChartConfig;

export function InventoryScatterChart() {
  const totalQuantity = scatterData.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Quantity vs Product</CardTitle>
        <CardDescription>Total Quantity: {totalQuantity}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ScatterChart>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="x"
              name="Product"
              tickFormatter={(value) =>
                scatterData.find((item) => item.x === value)?.product || ""
              }
            />
            <YAxis type="number" dataKey="y" name="Quantity" />
            <Tooltip content={<ChartTooltipContent />} />
            <Scatter
              name="Products"
              data={scatterData}
              fill="var(--color-quantity)"
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}