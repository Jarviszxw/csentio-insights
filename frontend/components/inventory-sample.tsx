import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  interface SkuData {
    sku: string;
    quantity: number;
  }
  
  const sampleData: SkuData[] = [
    { sku: "SKU001", quantity: 150 },
    { sku: "SKU002", quantity: 200 },
    { sku: "SKU003", quantity: 100 },
    { sku: "SKU004", quantity: 50 },
  ];
  
  export function InventorySample() {
    const totalQuantity = sampleData.reduce((sum, item) => sum + item.quantity, 0);
  
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Sample Inventory</CardTitle>
          <CardDescription>Total Quantity: {totalQuantity}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 @md/card:grid-cols-2 @lg/card:grid-cols-4">
            {sampleData.map((item) => (
              <div key={item.sku} className="p-4 border rounded-lg">
                <p className="font-semibold">{item.sku}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }