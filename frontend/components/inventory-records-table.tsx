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
import { Plus, PenSquare, Minus, Trash2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryRecords, addInventoryRecords, fetchProducts, InventoryRecord, updateInventoryRecord, Product } from '@/lib/api';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ProductSelection {
  skuName: string;
  skuCode: string;
  quantity: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface EditFormState {
  inventory_date?: Date;
  store?: string;
  productId?: string;
  skuName?: string;
  skuCode?: string;
  quantity?: number;
  type?: 'stock' | 'sample';
  remarks?: string;
  trackingNo?: string;
}

export function InventoryRecordsTable() {
  const queryClient = useQueryClient();
  const { storeId, stores, isLoading: storesLoading } = React.useContext(InventoryViewContext);

  const filteredStores = Array.isArray(stores) ? stores.filter((s) => s.id !== 'all') : [];

  const { data: records = [], isLoading: recordsLoading } = useQuery<InventoryRecord[]>({
    queryKey: ['inventoryRecords', storeId],
    queryFn: () => fetchInventoryRecords(storeId),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const addMutation = useMutation({
    mutationFn: addInventoryRecords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryDistribution'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
       console.error("Error adding records:", error);
       alert(`Failed to add records: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ recordId, data }: { recordId: string, data: Partial<Omit<InventoryRecord, 'id' | 'createTime' | 'is_sample'>> }) => updateInventoryRecord(recordId, data),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryDistribution'] });
      setIsEditDialogOpen(false);
    },
    onError: (error, variables) => {
       console.error(`Error updating record ${variables.recordId}:`, error);
       alert(`Failed to update record: ${error.message}`);
    }
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<InventoryRecord | null>(null);
  const [productSelections, setProductSelections] = React.useState<ProductSelection[]>([{ skuName: '', skuCode: '', quantity: 1 }]);
  const [addInventoryDate, setAddInventoryDate] = React.useState<Date | undefined>(new Date());
  const [isAddDatePickerOpen, setIsAddDatePickerOpen] = React.useState(false);
  const [addStore, setAddStore] = React.useState<string>('');
  const [addRemarks, setAddRemarks] = React.useState<string>('');
  const [addTrackingNo, setAddTrackingNo] = React.useState<string>('');
  const [addRecordType, setAddRecordType] = React.useState<'stock' | 'sample'>('stock');
  const [editFormState, setEditFormState] = React.useState<EditFormState>({});
  const [isEditDatePickerOpen, setIsEditDatePickerOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const currentRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const productsMap = React.useMemo(() => {
      return products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<string, Product>);
  }, [products]);

  React.useEffect(() => {
    if (selectedRecord && products.length > 0) {
        const product = products.find(p => p.code === selectedRecord.skuCode);
        const initialState = {
            inventory_date: new Date(selectedRecord.inventory_date),
            store: selectedRecord.store || '',
            productId: product?.id || '',
            skuName: selectedRecord.skuName,
            skuCode: selectedRecord.skuCode,
            quantity: selectedRecord.quantity,
            type: selectedRecord.type,
            remarks: selectedRecord.remarks || '',
            trackingNo: selectedRecord.trackingNo || '',
        };
        if (JSON.stringify(initialState) !== JSON.stringify(editFormState)) {
             setEditFormState(initialState);
        }
    } else {
        if (!selectedRecord && Object.keys(editFormState).length > 0) {
             setEditFormState({});
        }
    }
  }, [selectedRecord, products]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddProductSelection = () => {
    setProductSelections([...productSelections, { skuName: '', skuCode: '', quantity: 1 }]);
  };

  const handleRemoveProductSelection = (index: number) => {
    if (productSelections.length === 1) return;
    setProductSelections(productSelections.filter((_, i) => i !== index));
  };

  const handleAddProductChange = (index: number, selectedProductId: string) => {
    const newSelections = [...productSelections];
    const product = productsMap[selectedProductId];
    newSelections[index] = {
      ...newSelections[index],
      skuName: product?.name || '',
      skuCode: product?.code || '',
    };
    setProductSelections(newSelections);
  };

  const handleAddQuantityChange = (index: number, value: string) => {
    const newSelections = [...productSelections];
    const quantity = value === '' ? 0 : parseInt(value) || 0;
    newSelections[index].quantity = quantity;
    setProductSelections(newSelections);
  };

  const handleAddRecord = () => {
    if (!addStore) {
        alert("Please select a store.");
        return;
    }
    const newRecords = productSelections
      .filter((ps) => ps.skuName && ps.quantity > 0)
      .map((ps) => ({
        store: addStore,
        skuName: ps.skuName,
        skuCode: ps.skuCode,
        quantity: ps.quantity,
        remarks: addRemarks,
        trackingNo: addTrackingNo,
        createdBy: 'Current User',
        inventory_date: addInventoryDate ? format(addInventoryDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
        type: addRecordType,
      }));

    if (newRecords.length === 0) {
        alert("Please add at least one valid product with quantity > 0.");
        return;
    }
    addMutation.mutate(newRecords);
  };

  const handleEditInputChange = (field: keyof EditFormState, value: any) => {
      setEditFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleEditProductChange = (selectedProductId: string) => {
      const product = productsMap[selectedProductId];
      setEditFormState(prev => ({
          ...prev,
          productId: selectedProductId,
          skuName: product?.name || '',
          skuCode: product?.code || '',
      }));
  };

  const handleUpdateRecord = () => {
      if (!selectedRecord) return;
      if (!editFormState.productId) {
          alert("Please select a product.");
          return;
      }
       if (editFormState.quantity === undefined || editFormState.quantity < 0) {
          alert("Please enter a valid quantity (0 or greater).");
          return;
      }
       if (!editFormState.store) {
          alert("Please select a store.");
          return;
      }

      const dataForApi: Partial<Omit<InventoryRecord, 'id' | 'createTime' | 'is_sample'> & { inventory_date?: string }> = {
          store: editFormState.store,
          skuName: editFormState.skuName,
          skuCode: editFormState.skuCode,
          quantity: editFormState.quantity,
          type: editFormState.type,
          remarks: editFormState.remarks,
          trackingNo: editFormState.trackingNo,
          inventory_date: editFormState.inventory_date instanceof Date
              ? format(editFormState.inventory_date, 'yyyy-MM-dd')
              : undefined,
      };

      Object.keys(dataForApi).forEach(key => {
          const k = key as keyof typeof dataForApi;
          if (dataForApi[k] === undefined) {
              delete dataForApi[k];
          }
      });

      updateMutation.mutate({ recordId: selectedRecord.id, data: dataForApi });
  };

  const openAddDialog = () => {
      setProductSelections([{ skuName: '', skuCode: '', quantity: 1 }]);
      setAddStore(storeId === 'all' ? filteredStores[0]?.id || '' : storeId);
      setAddRemarks('');
      setAddTrackingNo('');
      setAddInventoryDate(new Date());
      setAddRecordType('stock');
      setIsAddDatePickerOpen(false);
      setIsAddDialogOpen(true);
  };

  const openEditDialog = (record: InventoryRecord) => {
      setSelectedRecord(record);
      setIsEditDatePickerOpen(false);
      setIsEditDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Inventory Records</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recordsLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-8 inline-block" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 inline-block" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : records.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground flex items-center justify-center min-h-[200px]">
            No inventory records found. Click "Add" to create a new record.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record: InventoryRecord) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.inventory_date), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {record.store || 'N/A'}
                      {/* <Badge variant="outline" className="whitespace-nowrap">{record.store || 'N/A'}</Badge> */}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium" title={record.skuName}>{record.skuName}</span>
                        <span className="text-xs text-muted-foreground">{record.skuCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {record.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'sample' ? 'secondary' : 'default'} className="text-xs">
                        {record.type === 'sample' ? 'Sample' : 'Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-center" title={record.remarks || "-"}>
                      {record.remarks || "-"}
                    </TableCell>
                    <TableCell className="text-center">{record.createdBy}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(record)}
                        aria-label="Edit inventory record"
                      >
                        <PenSquare className="h-4 w-4" />
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
                      {currentPage > 1 && (
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={"!cursor-pointer"}
                          aria-disabled={currentPage === 1}
                          tabIndex={currentPage === 1 ? -1 : undefined}
                        />
                      )}
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => i + 1).filter(page =>
                      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    ).map((page, index, arr) => (
                      <React.Fragment key={page}>
                         {index > 0 && arr[index-1] < page - 1 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className={page !== currentPage ? "!cursor-pointer" : undefined}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    ))}

                    <PaginationItem>
                      {currentPage < totalPages && (
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={"!cursor-pointer"}
                          aria-disabled={currentPage === totalPages}
                          tabIndex={currentPage === totalPages ? -1 : undefined}
                        />
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
               </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent
          className="sm:max-w-[700px]"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.rdp, [data-radix-popper-content-wrapper]')) { e.preventDefault(); }
          }}
          onPointerDownOutside={(e) => {
             const target = e.target as HTMLElement;
             if (target.closest('.rdp, [data-radix-popper-content-wrapper]')) { e.preventDefault(); }
          }}
        >
          <DialogHeader>
            <DialogTitle>New Inventory Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[200px_minmax(150px,_1fr)] gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="add_inventory_date">Date</Label>
                 <Popover open={isAddDatePickerOpen} onOpenChange={setIsAddDatePickerOpen}>
                   <PopoverTrigger asChild>
                     <Button
                        id="add_inventory_date"
                       variant={"outline"}
                       className={cn(
                         "w-[180px] justify-start text-left font-normal",
                         !addInventoryDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {addInventoryDate ? format(addInventoryDate, "PPP") : <span>Pick a date</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={addInventoryDate}
                       onSelect={(date) => { setAddInventoryDate(date); setIsAddDatePickerOpen(false); }}
                       disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_store">Store</Label>
                <ShadcnSelect value={addStore} onValueChange={setAddStore} disabled={storesLoading || storeId !== 'all'}>
                  <SelectTrigger id="add_store">
                    <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addRecordType">Record Type</Label>
              <ShadcnSelect value={addRecordType} onValueChange={(value) => setAddRecordType(value as 'stock' | 'sample')}>
                <SelectTrigger id="addRecordType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                </SelectContent>
              </ShadcnSelect>
            </div>

            <div className="flex items-center gap-4 mt-4 mb-2">
               <Label>Products List</Label>
               <Button variant="outline" size="sm" onClick={handleAddProductSelection} disabled={productsLoading}>
                 <Plus className="h-4 w-4 mr-1" />
                 Add
               </Button>
             </div>

             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 border rounded-md p-3">
               {productsLoading ? (
                 <div className="text-muted-foreground text-center p-4">Loading products...</div>
               ) : productSelections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Click ' + Add ' to add products.</p>
               ) : (
                  productSelections.map((selection, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ShadcnSelect
                         value={products.find(p => p.name === selection.skuName)?.id ? String(products.find(p => p.name === selection.skuName)?.id) : ''}
                        onValueChange={(value) => handleAddProductChange(index, value)}
                        disabled={productsLoading}
                      >
                        <SelectTrigger className="flex-grow min-w-[150px] h-auto py-2 pl-3 pr-2 text-left min-h-12">
                          <SelectValue placeholder={productsLoading ? "Loading..." : "Select product"}>
                             {selection.skuName ? (
                              <div className="flex flex-col items-start">
                                <span className="text-sm truncate">{selection.skuName}</span>
                                <span className="text-xs text-muted-foreground text-left">{selection.skuCode}</span>
                              </div>
                            ) : (
                              productsLoading ? "Loading..." : "Select product"
                            )}
                           </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                           {products.map((product: Product) => (
                             <SelectItem key={product.id} value={String(product.id)}>
                               <div>
                                 {product.name}
                                 <div className="text-xs text-muted-foreground">{product.code}</div>
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </ShadcnSelect>

                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={selection.quantity <= 0 ? '' : selection.quantity}
                        onChange={(e) => handleAddQuantityChange(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 text-center"
                      />
                      <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemoveProductSelection(index)}
                         disabled={productSelections.length <= 1}
                         className="text-muted-foreground hover:text-destructive"
                         aria-label="Remove product item"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))
               )}
             </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="add_tracking_no">Tracking No. (Optional)</Label>
                  <Input
                    id="add_tracking_no"
                    value={addTrackingNo}
                    onChange={(e) => setAddTrackingNo(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="add_remarks"
                    value={addRemarks}
                    onChange={(e) => setAddRemarks(e.target.value)}
                    placeholder="Enter remarks"
                    className="min-h-[40px]"
                  />
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord} disabled={addMutation.isPending || productSelections.every((ps) => !ps.skuName) || !addStore || productsLoading}>
               {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              {addMutation.isPending ? "Adding..." : "Add Records"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
            className="sm:max-w-[700px]"
             onInteractOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.rdp, [data-radix-popper-content-wrapper]')) { e.preventDefault(); }
             }}
             onPointerDownOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.rdp, [data-radix-popper-content-wrapper]')) { e.preventDefault(); }
             }}
        >
          <DialogHeader>
            <DialogTitle>Edit Inventory Record</DialogTitle>
            <DialogDescription>
              Make changes to the selected inventory record.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && !updateMutation.isPending ? (
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4 items-start">
                  <div className="space-y-2">
                    <Label htmlFor="edit_inventory_date">Date</Label>
                    <Popover open={isEditDatePickerOpen} onOpenChange={setIsEditDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                           id="edit_inventory_date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFormState.inventory_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormState.inventory_date ? format(editFormState.inventory_date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormState.inventory_date}
                          onSelect={(date) => { handleEditInputChange('inventory_date', date); setIsEditDatePickerOpen(false); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_store">Store</Label>
                    <ShadcnSelect
                        value={stores.find(s => s.name === editFormState.store)?.id || ''}
                        onValueChange={(storeId) => {
                            const storeName = stores.find(s => s.id === storeId)?.name;
                            handleEditInputChange('store', storeName || '');
                        }}
                        disabled={storesLoading}
                    >
                      <SelectTrigger id="edit_store">
                        <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.filter(s => s.id !== 'all').map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit_product">Product</Label>
                     <ShadcnSelect
                       value={editFormState.productId || ''}
                       onValueChange={handleEditProductChange}
                       disabled={productsLoading}
                     >
                       <SelectTrigger id="edit_product" className="h-auto py-2 pl-3 pr-2 text-left min-h-12">
                         <SelectValue placeholder={productsLoading ? "Loading..." : "Select product"}>
                           {editFormState.skuName ? (
                             <div className="flex flex-col items-start">
                               <span className="text-sm font-medium">{editFormState.skuName}</span>
                               <span className="text-xs text-muted-foreground text-left">{editFormState.skuCode}</span>
                             </div>
                           ) : ( productsLoading ? "Loading..." : "Select product" )}
                         </SelectValue>
                       </SelectTrigger>
                       <SelectContent>
                          {products.map((product: Product) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                              <div>
                                {product.name}
                                <div className="text-xs text-muted-foreground">{product.code}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </ShadcnSelect>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label htmlFor="edit_quantity">Quantity</Label>
                     <Input
                        id="edit_quantity"
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={editFormState.quantity ?? ''}
                        onChange={(e) => handleEditInputChange('quantity', e.target.value === '' ? undefined : parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                      />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_type">Record Type</Label>
                    <ShadcnSelect
                        value={editFormState.type || ''}
                        onValueChange={(value) => handleEditInputChange('type', value as 'stock' | 'sample')}
                    >
                      <SelectTrigger id="edit_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Stock</SelectItem>
                        <SelectItem value="sample">Sample</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_tracking_no">Tracking No. (Optional)</Label>
                      <Input
                        id="edit_tracking_no"
                        value={editFormState.trackingNo || ''}
                        onChange={(e) => handleEditInputChange('trackingNo', e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_remarks">Remarks (Optional)</Label>
                      <Textarea
                        id="edit_remarks"
                        value={editFormState.remarks || ''}
                        onChange={(e) => handleEditInputChange('remarks', e.target.value)}
                        placeholder="Enter remarks"
                        className="min-h-[40px]"
                      />
                    </div>
                </div>

             </div>
           ) : (
             <div className="flex justify-center items-center h-60">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
           )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord} disabled={!selectedRecord || updateMutation.isPending || productsLoading || storesLoading}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
}