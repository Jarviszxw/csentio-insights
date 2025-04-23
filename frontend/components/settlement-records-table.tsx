"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, PenSquare } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRange } from "./date-range-context";
import { useSettlementView } from "./settlement-filter";
import { Textarea } from "./ui/textarea";

interface SettlementRecord {
  id: string;
  create_time: string;
  settle_date: string;
  store: string;
  sku_name: string;
  sku_code: string;
  quantity: number;
  price: number;
  remarks?: string;
  created_by: string;
}

// 模拟结算记录数据
const mockRecords: SettlementRecord[] = [
  {
    id: "STL-001",
    create_time: "2023-06-15T09:30:00Z",
    settle_date: "2023-06-15",
    store: "Store A",
    sku_name: "Product Alpha",
    sku_code: "SK-001",
    quantity: 50,
    price: 100.00,
    remarks: "Monthly settlement",
    created_by: "John Doe"
  },
  {
    id: "STL-002",
    create_time: "2023-06-16T14:20:00Z", 
    settle_date: "2023-06-16",
    store: "Store B",
    sku_name: "Product Beta",
    sku_code: "SK-002",
    quantity: 30,
    price: 120.00,
    remarks: "Special promotion",
    created_by: "Jane Smith"
  },
  {
    id: "STL-003",
    create_time: "2023-06-18T11:45:00Z",
    settle_date: "2023-06-18",
    store: "Store A", 
    sku_name: "Product Gamma",
    sku_code: "SK-003",
    quantity: 20,
    price: 80.00,
    created_by: "Alice Johnson"
  },
  {
    id: "STL-004",
    create_time: "2023-06-20T16:10:00Z",
    settle_date: "2023-06-20",
    store: "Store C",
    sku_name: "Product Delta",
    sku_code: "SK-004", 
    quantity: 15,
    price: 150.00,
    remarks: "End of season",
    created_by: "Bob Wilson"
  },
  {
    id: "STL-005",
    create_time: "2023-06-22T10:00:00Z",
    settle_date: "2023-06-22",
    store: "Store B",
    sku_name: "Product Alpha",
    sku_code: "SK-001",
    quantity: 25,
    price: 100.00,
    created_by: "Charlie Brown"
  },
  {
    id: "STL-006",
    create_time: "2023-06-25T08:30:00Z",
    settle_date: "2023-06-25",
    store: "Store A",
    sku_name: "Product Beta",
    sku_code: "SK-002",
    quantity: 40,
    price: 120.00,
    remarks: "Weekly settlement",
    created_by: "David Lee"
  }
];

// 模拟店铺数据
const stores = [
  { id: "store-a", name: "Store A" },
  { id: "store-b", name: "Store B" },
  { id: "store-c", name: "Store C" },
];

// 模拟产品数据
const products = [
  { id: "prod-001", name: "Product Alpha", code: "SK-001", price: 100.00 },
  { id: "prod-002", name: "Product Beta", code: "SK-002", price: 120.00 },
  { id: "prod-003", name: "Product Gamma", code: "SK-003", price: 80.00 },
  { id: "prod-004", name: "Product Delta", code: "SK-004", price: 150.00 },
  { id: "prod-005", name: "Product Epsilon", code: "SK-005", price: 90.00 },
  { id: "prod-006", name: "Product Zeta", code: "SK-006", price: 110.00 },
];

export function SettlementRecordsTable() {
  const { dateRange } = useDateRange();
  const { viewMode, storeId } = useSettlementView();
  const [records, setRecords] = React.useState<SettlementRecord[]>(mockRecords);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<SettlementRecord | null>(null);
  const [newRecord, setNewRecord] = React.useState<Partial<SettlementRecord>>({
    settle_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    price: 0
  });
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  
  const itemsPerPage = 5;
  
  // 根据视图模式和选择的商店过滤记录
  const filteredRecords = React.useMemo(() => {
    if (viewMode === "by-store" && storeId !== "all") {
      const selectedStore = stores.find(store => store.id === storeId)?.name || "";
      return records.filter(record => record.store === selectedStore);
    }
    return records;
  }, [records, viewMode, storeId]);
  
  // 按create_time从新到旧排序
  const sortedRecords = React.useMemo(() => {
    return [...filteredRecords].sort((a, b) => 
      new Date(b.create_time).getTime() - new Date(a.create_time).getTime()
    );
  }, [filteredRecords]);
  
  // 计算总页数
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  
  // 获取当前页的记录
  const currentRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);
  
  // 页面变化处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 添加记录处理函数
  const handleAddRecord = () => {
    const id = `STL-${String(records.length + 1).padStart(3, '0')}`;
    const newSettlementRecord: SettlementRecord = {
      id,
      create_time: new Date().toISOString(),
      settle_date: newRecord.settle_date || new Date().toISOString().split('T')[0],
      store: newRecord.store || 'Store A',
      sku_name: newRecord.sku_name || 'Product Alpha',
      sku_code: newRecord.sku_code || 'SK-001',
      quantity: newRecord.quantity || 1,
      price: newRecord.price || 0,
      remarks: newRecord.remarks,
      created_by: 'Current User'
    };
    
    setRecords([...records, newSettlementRecord]);
    setIsAddDialogOpen(false);
    setNewRecord({
      settle_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      price: 0
    });
  };
  
  // 编辑记录处理函数
  const handleEditRecord = () => {
    if (!selectedRecord) return;
    
    const updatedRecords = records.map(record => 
      record.id === selectedRecord.id ? selectedRecord : record
    );
    
    setRecords(updatedRecords);
    setIsEditDialogOpen(false);
    setSelectedRecord(null);
  };
  
  // 删除记录处理函数
  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(record => record.id !== id));
  };
  
  // 产品更改处理函数
  const handleProductChange = (productName: string, isEdit: boolean = false) => {
    const product = products.find(p => p.name === productName);
    
    if (product) {
      if (isEdit && selectedRecord) {
        setSelectedRecord({
          ...selectedRecord,
          sku_name: product.name,
          sku_code: product.code,
          price: product.price
        });
      } else {
        setNewRecord({
          ...newRecord,
          sku_name: product.name,
          sku_code: product.code,
          price: product.price
        });
      }
    }
  };
  
  // 处理多产品选择
  const handleProductsChange = (productNames: string[]) => {
    setSelectedProducts(productNames);
    // 更新新记录中的产品信息，这里简化处理，实际可能需要更复杂的逻辑
    if (productNames.length > 0) {
      const firstProduct = products.find(p => p.name === productNames[0]);
      if (firstProduct) {
        setNewRecord({
          ...newRecord,
          sku_name: firstProduct.name,
          sku_code: firstProduct.code,
          price: firstProduct.price
        });
      }
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd HH:mm");
  };
  
  // 格式化货币
  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Settlement Records</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
          {/* <Button size="sm" variant="outline" className="gap-1">
            <PenSquare className="h-4 w-4" />
            Edit
          </Button> */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Create Time</TableHead>
              <TableHead>Settle Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {formatDate(record.create_time)}
                </TableCell>
                <TableCell>
                  {record.settle_date}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{record.store}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{record.sku_name}</span>
                    <span className="text-xs text-muted-foreground">{record.sku_code}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {record.quantity}
                </TableCell>
                <TableCell>
                  {formatCurrency(record.price)}
                </TableCell>
                <TableCell>
                  {record.remarks || "-"}
                </TableCell>
                <TableCell>
                  {record.created_by}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRecord(record);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <PenSquare className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <div className="flex justify-end mt-4">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                  </PaginationItem>
                )}
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // 最多显示5个页码，其他用省略号
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Settlement Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settle_date">Date</Label>
                <Input
                  id="settle_date"
                  type="date"
                  value={newRecord.settle_date || ''}
                  onChange={(e) => setNewRecord({...newRecord, settle_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select
                  value={newRecord.store || ''}
                  onValueChange={(value) => setNewRecord({...newRecord, store: value})}
                >
                  <SelectTrigger id="store">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.name}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="products">Products (Multiple Selection)</Label>
              <Select
                value={newRecord.sku_name || ''}
                onValueChange={(value) => handleProductChange(value)}
              >
                <SelectTrigger id="products">
                  <SelectValue placeholder="Select products" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.name}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newRecord.quantity || ''}
                  onChange={(e) => setNewRecord({...newRecord, quantity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRecord.price || ''}
                  onChange={(e) => setNewRecord({...newRecord, price: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={newRecord.remarks || ''}
                onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {selectedRecord && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Settlement Record</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_settle_date">Settlement Date</Label>
                  <Input
                    id="edit_settle_date"
                    type="date"
                    value={selectedRecord.settle_date || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, settle_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_store">Store</Label>
                  <Select
                    value={selectedRecord.store || ''}
                    onValueChange={(value) => setSelectedRecord({...selectedRecord, store: value})}
                  >
                    <SelectTrigger id="edit_store">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.name}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_product">Product</Label>
                  <Select
                    value={selectedRecord.sku_name || ''}
                    onValueChange={(value) => handleProductChange(value, true)}
                  >
                    <SelectTrigger id="edit_product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_sku_code">SKU Code</Label>
                  <Input
                    id="edit_sku_code"
                    value={selectedRecord.sku_code || ''}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_quantity">Quantity</Label>
                  <Input
                    id="edit_quantity"
                    type="number"
                    min="1"
                    value={selectedRecord.quantity || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, quantity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_price">Price</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedRecord.price || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, price: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_remarks">Remarks</Label>
                <Input
                  id="edit_remarks"
                  value={selectedRecord.remarks || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, remarks: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRecord}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
} 