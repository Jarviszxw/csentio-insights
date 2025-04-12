import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  interface InventoryRecord {
    id: string;
    sku: string;
    quantity: number;
    store: string;
    date: string;
  }
  
  const records: InventoryRecord[] = [
    { id: "1", sku: "SKU001", quantity: 50, store: "Store A", date: "2025-01-15" },
    { id: "2", sku: "SKU002", quantity: 75, store: "Store B", date: "2025-02-10" },
    { id: "3", sku: "SKU003", quantity: 30, store: "Store A", date: "2025-03-05" },
    { id: "4", sku: "SKU004", quantity: 20, store: "Store C", date: "2025-04-01" },
  ];
  
  export function InventoryRecordsTable() {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Detailed Inventory Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>{record.sku}</TableCell>
                  <TableCell>{record.quantity}</TableCell>
                  <TableCell>{record.store}</TableCell>
                  <TableCell>{record.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }