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
  import { DatePicker } from "@/components/ui/date-picker";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Checkbox } from "@/components/ui/checkbox";
  import { X } from "lucide-react";
  
  interface InventoryRecord {
    id: string;
    createTime: string;
    store: string;
    skuName: string;
    skuCode: string;
    quantity: number;
    trackingNo?: string;
    remarks?: string;
    createdBy: string;
    inventory_date: string;
  }
  
  const mockRecords: InventoryRecord[] = [
    {
      id: "INV-001",
      createTime: "2023-06-15T09:30:00Z",
      store: "Store A",
      skuName: "Product Alpha",
      skuCode: "SK-001",
      quantity: 50,
      trackingNo: "TRK-123456",
      remarks: "Regular stock refill",
      createdBy: "John Doe",
      inventory_date: "2023-06-15"
    },
    {
      id: "INV-002",
      createTime: "2023-06-16T14:20:00Z", 
      store: "Store B",
      skuName: "Product Beta",
      skuCode: "SK-002",
      quantity: 30,
      trackingNo: "TRK-789012",
      remarks: "Express delivery",
      createdBy: "Jane Smith",
      inventory_date: "2023-06-16"
    },
    {
      id: "INV-003",
      createTime: "2023-06-18T11:45:00Z",
      store: "Store A", 
      skuName: "Product Gamma",
      skuCode: "SK-003",
      quantity: 20,
      trackingNo: "TRK-345678",
      createdBy: "Alice Johnson",
      inventory_date: "2023-06-18"
    },
    {
      id: "INV-004",
      createTime: "2023-06-20T16:10:00Z",
      store: "Store C",
      skuName: "Product Delta",
      skuCode: "SK-004", 
      quantity: 15,
      remarks: "Special order",
      createdBy: "Bob Wilson",
      inventory_date: "2023-06-20"
    },
    {
      id: "INV-005",
      createTime: "2023-06-22T10:00:00Z",
      store: "Store B",
      skuName: "Product Alpha",
      skuCode: "SK-001",
      quantity: 25,
      trackingNo: "TRK-901234",
      createdBy: "Charlie Brown",
      inventory_date: "2023-06-22"
    },
    {
      id: "INV-006",
      createTime: "2023-06-25T08:30:00Z",
      store: "Store A",
      skuName: "Product Beta",
      skuCode: "SK-002",
      quantity: 40,
      trackingNo: "TRK-567890",
      remarks: "Urgent delivery",
      createdBy: "David Lee",
      inventory_date: "2023-06-25"
    },
    {
      id: "INV-007",
      createTime: "2023-06-27T13:15:00Z",
      store: "Store C",
      skuName: "Product Gamma",
      skuCode: "SK-003",
      quantity: 35,
      trackingNo: "TRK-234567",
      createdBy: "Emma Wilson",
      inventory_date: "2023-06-27"
    },
    {
      id: "INV-008",
      createTime: "2023-06-29T11:00:00Z",
      store: "Store B",
      skuName: "Product Delta",
      skuCode: "SK-004",
      quantity: 22,
      remarks: "Monthly restock",
      createdBy: "Frank Zhang",
      inventory_date: "2023-06-29"
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
    { id: "prod-001", name: "Product Alpha", code: "SK-001" },
    { id: "prod-002", name: "Product Beta", code: "SK-002" },
    { id: "prod-003", name: "Product Gamma", code: "SK-003" },
    { id: "prod-004", name: "Product Delta", code: "SK-004" },
    { id: "prod-005", name: "Product Epsilon", code: "SK-005" },
    { id: "prod-006", name: "Product Zeta", code: "SK-006" },
  ];
  
  export function InventoryRecordsTable() {
    const [records, setRecords] = React.useState<InventoryRecord[]>(mockRecords);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    const [selectedRecord, setSelectedRecord] = React.useState<InventoryRecord | null>(null);
    const [newRecord, setNewRecord] = React.useState<Partial<InventoryRecord>>({
      quantity: 1
    });
    const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
    const [selectedProductQuantities, setSelectedProductQuantities] = React.useState<Record<string, number>>({});
    const [inventoryDate, setInventoryDate] = React.useState<Date | undefined>(new Date());
    
    const itemsPerPage = 5;
    
    // 按createTime从新到旧排序
    const sortedRecords = React.useMemo(() => {
      return [...records].sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    }, [records]);
    
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

    // Handle adding multiple products at once
    const handleAddRecord = () => {
      // Create records for each selected product
      const newRecords = selectedProducts.map((productName, index) => {
        const product = products.find(p => p.name === productName);
        const quantity = selectedProductQuantities[productName] || 1;
        
        return {
          id: `INV-${String(records.length + index + 1).padStart(3, '0')}`,
          createTime: new Date().toISOString(),
          inventory_date: inventoryDate ? format(inventoryDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
          store: newRecord.store || 'Store A',
          skuName: product?.name || '',
          skuCode: product?.code || '',
          quantity: quantity,
          remarks: newRecord.remarks,
          createdBy: 'Current User'
        };
      });
      
      setRecords([...records, ...newRecords]);
      setIsAddDialogOpen(false);
      setNewRecord({
        quantity: 1
      });
      setSelectedProducts([]);
      setSelectedProductQuantities({});
    };
    
    // Toggle product selection
    const handleProductSelect = (productName: string, isChecked: boolean) => {
      if (isChecked) {
        setSelectedProducts(prev => [...prev, productName]);
        // Set default quantity to 1
        setSelectedProductQuantities(prev => ({
          ...prev,
          [productName]: 1
        }));
      } else {
        setSelectedProducts(prev => prev.filter(p => p !== productName));
        // Remove quantity for this product
        const updatedQuantities = { ...selectedProductQuantities };
        delete updatedQuantities[productName];
        setSelectedProductQuantities(updatedQuantities);
      }
    };
    
    // Update quantity for a specific product
    const handleQuantityChange = (productName: string, quantity: number) => {
      setSelectedProductQuantities(prev => ({
        ...prev,
        [productName]: quantity
      }));
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

    // 产品更改处理函数
    const handleProductChange = (productName: string, isEdit: boolean = false) => {
      const product = products.find(p => p.name === productName);
      
      if (product) {
        if (isEdit && selectedRecord) {
          setSelectedRecord({
            ...selectedRecord,
            skuName: product.name,
            skuCode: product.code
          });
        } else {
          setNewRecord({
            ...newRecord,
            skuName: product.name,
            skuCode: product.code
          });
        }
      }
    };

    return (
      <Card className="w-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Inventory Records</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Create Time</TableHead>
                <TableHead>Inventory Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.createTime), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.inventory_date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.store}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{record.skuName}</span>
                      <span className="text-xs text-muted-foreground">{record.skuCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {record.quantity}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.remarks || "-"}
                  </TableCell>
                  <TableCell>{record.createdBy}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    // 显示前后各一页，当前页和第一页/最后一页
                    if (
                      page === 1 || 
                      page === totalPages || 
                      page === currentPage || 
                      page === currentPage - 1 || 
                      page === currentPage + 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      (page === 2 && currentPage > 3) || 
                      (page === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Inventory Record</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory_date">Inventory Date</Label>
                  <DatePicker
                    date={inventoryDate} 
                    setDate={setInventoryDate} 
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
                <Label>Products (Multiple Selection)</Label>
                <ScrollArea className="h-[180px] border rounded-md p-2">
                  <div className="space-y-2">
                    {products.map((product) => {
                      const isSelected = selectedProducts.includes(product.name);
                      return (
                        <div key={product.id} className="flex flex-col space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`product-${product.id}`} 
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleProductSelect(product.name, checked as boolean)
                              }
                            />
                            <Label htmlFor={`product-${product.id}`} className="flex-1">
                              {product.name} ({product.code})
                            </Label>
                            
                            {isSelected && (
                              <div className="flex items-center space-x-2">
                                <Label className="text-xs">Quantity:</Label>
                                <Input 
                                  type="number" 
                                  min="1"
                                  className="w-20 h-8"
                                  value={selectedProductQuantities[product.name] || 1}
                                  onChange={(e) => handleQuantityChange(
                                    product.name, 
                                    parseInt(e.target.value) || 1
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {selectedProducts.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-1">Selected Products: {selectedProducts.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((productName) => {
                        const product = products.find(p => p.name === productName);
                        const quantity = selectedProductQuantities[productName] || 1;
                        return (
                          <Badge key={productName} variant="secondary" className="flex items-center gap-1">
                            {productName} (Qty: {quantity})
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 ml-1 p-0"
                              onClick={() => handleProductSelect(productName, false)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
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
              <Button onClick={handleAddRecord} disabled={selectedProducts.length === 0}>Add Records</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {selectedRecord && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Inventory Record</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_inventory_date">Inventory Date</Label>
                    <DatePicker 
                      date={selectedRecord ? new Date(selectedRecord.inventory_date) : undefined} 
                      setDate={(date) => {
                        if (date && selectedRecord) {
                          setSelectedRecord({
                            ...selectedRecord, 
                            inventory_date: format(date, 'yyyy-MM-dd')
                          });
                        }
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_store">Store</Label>
                    <Select
                      value={selectedRecord.store}
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
                      value={selectedRecord.skuName}
                      onValueChange={(value) => handleProductChange(value, true)}
                    >
                      <SelectTrigger id="edit_product">
                        <SelectValue placeholder="Select product" />
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
                  <div className="space-y-2">
                    <Label htmlFor="edit_quantity">Quantity</Label>
                    <Input
                      id="edit_quantity"
                      type="number"
                      min="1"
                      value={selectedRecord.quantity}
                      onChange={(e) => setSelectedRecord({...selectedRecord, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_tracking_no">Tracking No.</Label>
                    <Input
                      id="edit_tracking_no"
                      value={selectedRecord.trackingNo || ''}
                      onChange={(e) => setSelectedRecord({...selectedRecord, trackingNo: e.target.value})}
                    />
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