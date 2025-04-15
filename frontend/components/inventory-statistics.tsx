"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 模拟数据，实际应用中应该从API获取
const mockData = {
  sample: {
    totalQuantity: 471,
    skuDetails: [
      { id: 1, name: "SK-001", quantity: 120 },
      { id: 2, name: "SK-002", quantity: 85 },
      { id: 3, name: "SK-003", quantity: 64 },
      { id: 4, name: "SK-004", quantity: 37 },
      { id: 5, name: "SK-005", quantity: 93 },
      { id: 6, name: "SK-006", quantity: 72 },
    ]
  },
  inventory: {
    totalQuantity: 1250,
    skuDetails: [
      { id: 1, name: "SK-001", quantity: 350 },
      { id: 2, name: "SK-002", quantity: 240 },
      { id: 3, name: "SK-003", quantity: 180 },
      { id: 4, name: "SK-004", quantity: 120 },
      { id: 5, name: "SK-005", quantity: 210 },
      { id: 6, name: "SK-006", quantity: 150 },
    ]
  }
};

export function InventoryStatistics() {
  // 实际应用中应该通过API获取数据
  const [data, setData] = React.useState(mockData);

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Inventory Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-1">
        {/* 第一行：Total Sample */}
        <div className="flex items-center">
          <div className="flex flex-col w-48">
            <span className="text-sm text-muted-foreground">Total Sample</span>
            <span className="text-2xl font-bold">{data.sample.totalQuantity}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.sample.skuDetails.map((sku) => (
              <Badge key={sku.id} variant="outline" className="flex items-center gap-1">
                <span className="text-m font-medium">{sku.name}</span>
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {sku.quantity}
                </span>
              </Badge>
            ))}
          </div>
        </div>
        
        {/* 分隔线 */}
        <div className="h-px w-full bg-border"></div>
        
        {/* 第二行：Total Inventory */}
        <div className="flex items-center">
          <div className="flex flex-col w-48">
            <span className="text-sm text-muted-foreground">Total Inventory</span>
            <span className="text-2xl font-bold">{data.inventory.totalQuantity}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.inventory.skuDetails.map((sku) => (
              <Badge key={sku.id} variant="outline" className="flex items-center gap-1">
                <span className="text-m font-medium">{sku.name}</span>
                <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {sku.quantity}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 