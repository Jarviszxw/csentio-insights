// settlement-records-table.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { Plus, PenSquare, Eye, Calendar as CalendarIcon, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRange } from "./date-range-context";
import { useSettlementView } from "./settlement-filter";
import { Textarea } from "./ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditSettlementDialog, SettlementUpdatePayload } from "./edit-settlement-dialog";
import { Skeleton } from "./ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchSettlementRecords, SettlementRecord, SettlementItem } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

// Restore necessary local type definitions
interface SettlementItemForm {
  product_id?: number;
  quantity?: number;
  unit_price?: number;
}

interface Product {
  id: number;
  name: string;
  code: string;
  price?: number;
}

// Restore SettlementResponse locally if not exported from lib/api
interface SettlementResponse {
  settlement_id: number;
  settle_date: string;
  store_id: number;
  total_amount: number;
  remarks: string | null;
  created_by: string | null;
  items: SettlementItem[]; // Use imported SettlementItem
}

export function SettlementRecordsTable() {
  const { dateRange } = useDateRange();
  const { viewMode, storeId, stores, loadingStores } = useSettlementView();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<SettlementRecord | null>(null);

  let start: Date | undefined;
  let end: Date | undefined;

  if (dateRange?.from && dateRange?.to) {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    start = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    end = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
  }

  // 将 storeId 转换为整数
  const storeIdNum = storeId && storeId !== "all" ? parseInt(storeId) : undefined;

  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useQuery<SettlementRecord[]>({
    queryKey: ['settlementRecords', storeIdNum, start, end],
    queryFn: () => fetchSettlementRecords(storeIdNum?.toString(), start, end),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    retryDelay: 1000,
  });

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [productsError, setProductsError] = React.useState<string | null>(null);

  const [settlementItems, setSettlementItems] = React.useState<SettlementItemForm[]>([{ product_id: undefined, quantity: 1, unit_price: 0 }]);

  // Use settle_date (string) instead of settle_date_obj (Date) in state
  const [newRecord, setNewRecord] = React.useState<Partial<SettlementRecord & { settle_date: string | undefined }>>({
    settle_date: format(new Date(), 'yyyy-MM-dd'), // Initialize with today's date as string
    total_amount: 0,
    store_id: undefined,
    remarks: ''
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const [isAddingRecord, setIsAddingRecord] = React.useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [recordToEdit, setRecordToEdit] = React.useState<SettlementResponse | null>(null);
  const [isEditingRecord, setIsEditingRecord] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [isFetchingItems, setIsFetchingItems] = React.useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SettlementItem[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);

  const itemsPerPage = 5;
  
  const filteredRecords = React.useMemo(() => {
    if (viewMode === "by-store" && storeId !== "all") {
      const selectedStoreName = stores.find(s => String(s.store_id) === storeId)?.store_name;
      if (selectedStoreName) {
        return records.filter(record => record.store === selectedStoreName); 
      }
      return [];
    }
    return records; 
  }, [records, viewMode, storeId, stores]);
  
  const sortedRecords = React.useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const dateA = a.settle_date ? new Date(a.settle_date).getTime() : 0;
      const dateB = b.settle_date ? new Date(b.settle_date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
  }, [filteredRecords]);
  
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  
  const currentRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddRecord = async () => {
    // Use newRecord.settle_date directly (already string)
    const settleDateString = newRecord.settle_date || format(new Date(), 'yyyy-MM-dd');

    if (!newRecord.store_id || settlementItems.some(item => !item.product_id || !item.quantity)) {
        console.error("Missing required fields: Store ID or Item details");
        return;
    }

    const payload = {
        settle_date: settleDateString,
        store_id: newRecord.store_id,
        total_amount: newRecord.total_amount ?? 0,
        remarks: newRecord.remarks,
        items: settlementItems.map(item => ({
            product_id: item.product_id!,
            quantity: item.quantity!,
            unit_price: item.unit_price ?? 0 
        }))
    };
    
    console.log("Adding Record Payload:", JSON.stringify(payload, null, 2)); 
    
    try {
        setIsAddingRecord(true);
        const response = await fetch('http://localhost:8000/api/settlements/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ detail: 'Unknown error structure' }));
            throw new Error(`Failed to add settlement: ${response.status} - ${errorData.detail || response.statusText}`);
        }

        const createdData = await response.json();
        console.log("API Response:", createdData);
        setIsAddDialogOpen(false);
        setNewRecord({
          settle_date: format(new Date(), 'yyyy-MM-dd'), // Reset with today's string date
          total_amount: 0,
          store_id: undefined,
          remarks: ''
        });
        setSettlementItems([{ product_id: undefined, quantity: 1, unit_price: 0 }]);
        await refetchRecords();
    } catch (error) {
        console.error("Failed to submit settlement:", error);
    } finally {
        setIsAddingRecord(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd"); 
    } catch (error) {
      return dateString; 
    }
  };
  
  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        const response = await fetch(`${API_BASE_URL}/info/products`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }); 
        if (!response.ok) {
          let errorMsg = 'Failed to fetch products';
          try {
            const errorData = await response.json();
            errorMsg = `Failed to fetch products: ${response.status} ${response.statusText} - ${errorData.detail || JSON.stringify(errorData)}`;
          } catch (jsonError) {
            errorMsg = `Failed to fetch products: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }
        const data: Product[] = await response.json();
        const sortedData = [...data].sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );
        setProducts(sortedData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProductsError(err instanceof Error ? err.message : 'An unknown error occurred');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = () => {
    setSettlementItems([...settlementItems, { product_id: undefined, quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSettlementItems(settlementItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SettlementItemForm, value: any) => {
    console.log(`handleItemChange: index=${index}, field=${field}, value=${value}`);
    const updatedItems = [...settlementItems];
    let numValue: number | undefined;

    if (field === 'quantity') {
      numValue = value ? Math.max(1, Number(value)) : undefined;
    } else if (field === 'unit_price') {
        numValue = value ? Math.max(0, Number(value)) : undefined;
    } else if (field === 'product_id') {
        numValue = value ? Number(value) : undefined;
    } else {
      return; 
    }

    updatedItems[index] = { ...updatedItems[index], [field]: numValue };

    if (field === 'product_id' && numValue !== undefined) {
      const selectedProduct = products.find(p => p.id === numValue);
      console.log(`Selected product for ID ${numValue}:`, selectedProduct);
      updatedItems[index].unit_price = selectedProduct?.price ?? 0;
      console.log(`Set unit_price for index ${index} to: ${updatedItems[index].unit_price}`);
    }

    setSettlementItems(updatedItems);
  };

  React.useEffect(() => {
    const calculatedTotal = settlementItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const price = item.unit_price || 0;
      return sum + (quantity * price);
    }, 0);
    setNewRecord(prev => ({ ...prev, total_amount: calculatedTotal }));
  }, [settlementItems]);

  const handleViewItems = async (record: SettlementRecord) => {
      console.log("Viewing items for record ID:", record.id);
      setSelectedSettlementId(record.id);
      setIsFetchingItems(true);
      setIsItemModalOpen(true);
      setSelectedItems([]);

      try {
          const settlementIdNumber = parseInt(String(record.id).replace('STL-', ''));
          if (isNaN(settlementIdNumber)) {
              throw new Error("Invalid Settlement ID format");
          }
          const response = await fetch(`${API_BASE_URL}/settlement/${settlementIdNumber}`);
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch items' }));
              throw new Error(errorData.detail || `HTTP error ${response.status}`);
          }
          const data: SettlementResponse = await response.json();
          const itemsToShow: SettlementItem[] = data.items.map(item => ({
              item_id: item.item_id,
              settlement_id: item.settlement_id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              products: item.products ? {
                 product_id: item.products.product_id,
                 sku_name: item.products.sku_name,
                 sku_code: item.products.sku_code
              } : undefined
          }));
          setSelectedItems(itemsToShow);
      } catch (error) {
          console.error("Failed to fetch settlement items:", error);
          setSelectedItems([]);
      } finally {
          setIsFetchingItems(false);
      }
  };

  const handleEditRecord = async (record: SettlementRecord) => {
       console.log("Editing record ID:", record.id);
       setRecordToEdit(null);
       setEditError(null);
       setIsEditingRecord(true);
       setIsEditDialogOpen(true);

       try {
           const settlementIdNumber = parseInt(String(record.id).replace('STL-', ''));
           if (isNaN(settlementIdNumber)) {
               throw new Error("Invalid Settlement ID format for edit");
           }
           const response = await fetch(`${API_BASE_URL}/settlement/${settlementIdNumber}`);
           if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch record for editing' }));
                throw new Error(errorData.detail || `HTTP error ${response.status}`);
           }
           const data: SettlementResponse = await response.json();
           setRecordToEdit(data);
       } catch (error) {
           console.error("Failed to fetch settlement for editing:", error);
           setEditError(error instanceof Error ? error.message : "Unknown error fetching data");
       } finally {
           setIsEditingRecord(false);
       }
  };

  const handleUpdateRecord = async (updatedData: SettlementUpdatePayload) => {
        if (!recordToEdit) return;
        console.log("Updating settlement ID:", recordToEdit.settlement_id);
        setEditError(null);
        setIsEditingRecord(true);

        try {
             const response = await fetch(`${API_BASE_URL}/settlement/${recordToEdit.settlement_id}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(updatedData),
             });
             if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ detail: 'Update failed' }));
                  throw new Error(errorData.detail || `HTTP error ${response.status}`);
             }
             const savedRecord: SettlementResponse = await response.json();
             console.log("Successfully updated:", savedRecord);
             
             await refetchRecords();
             setIsEditDialogOpen(false);
        } catch (error) {
             console.error("Failed to update settlement:", error);
             setEditError(error instanceof Error ? error.message : "Unknown error during update");
        } finally {
             setIsEditingRecord(false);
        }
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
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordsLoading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 inline-block ml-1" />
                    <Skeleton className="h-8 w-8 inline-block ml-1" />
                  </TableCell>
                </TableRow>
              ))
            ) : currentRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  {filteredRecords.length === 0 && !recordsLoading ?
                    'No settlement records found for the selected criteria. Click "Add" to create one.' :
                    'No records on this page.'}
                </TableCell>
              </TableRow>
            ) : (
              currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.settle_date}</TableCell>
                  <TableCell className="text-left">
                    {record.store || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">{formatCurrency(record.total_amount || 0)}</TableCell>
                  <TableCell>{record.remarks || "-"}</TableCell>
                  <TableCell>{record.created_by}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewItems(record)}
                        aria-label="View settlement items"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log("Edit clicked for:", record.id);
                          handleEditRecord(record);
                        }}
                        aria-label="Edit settlement record"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent 
          className="sm:max-w-[700px]" 
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.rdp')) { 
                e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
             const target = e.target as HTMLElement;
             if (target.closest('.rdp')) { 
                e.preventDefault();
             }
          }}
         >
          <DialogHeader>
            <DialogTitle>New Settlement Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-[200px_minmax(150px,_1fr)] gap-4 items-center">
               <div className="space-y-2">
                 <Label htmlFor="settle_date">Date</Label>
                 <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen} modal={true}>
                   <PopoverTrigger asChild>
                     <Button
                       variant={"outline"}
                       className={cn(
                         "w-[180px] justify-start text-left font-normal",
                         !newRecord.settle_date && "text-muted-foreground" // Check settle_date string
                       )}
                       onClick={() => setIsDatePickerOpen(true)}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {/* Format string date for display */}
                       {newRecord.settle_date ? format(new Date(newRecord.settle_date), "LLL d, y") : <span>Pick a date</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       // Provide Date object to Calendar, selected based on string state
                       selected={newRecord.settle_date ? new Date(newRecord.settle_date) : undefined}
                       onSelect={(date) => {
                         // Update state with formatted string date
                         setNewRecord({...newRecord, settle_date: date ? format(date, 'yyyy-MM-dd') : undefined });
                         setIsDatePickerOpen(false);
                       }}
                     />
                   </PopoverContent>
                 </Popover>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="store">Store</Label>
                 <Select
                   value={newRecord.store_id ? String(newRecord.store_id) : ''}
                   onValueChange={(value) => setNewRecord({...newRecord, store_id: value ? Number(value) : undefined })}
                   disabled={loadingStores}
                 >
                   <SelectTrigger id="store">
                     <SelectValue placeholder={loadingStores ? "Loading stores..." : "Select store"} />
                   </SelectTrigger>
                   <SelectContent>
                     {stores.map((store) => (
                       <SelectItem key={store.store_id} value={String(store.store_id)}>
                         {store.store_name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>

             <div className="flex items-center justify-between mt-2">
               <Label className="text-base font-medium">Settlement Items</Label>
               <div className="flex items-center gap-1">
                 <div className="flex items-center gap-3">
                   <div className="w-22 text-right">
                     <Label className="text-sm text-muted-foreground">Unit Price</Label>
                   </div>
                   <div className="w-0 text-right">
                     <Label className="text-sm text-muted-foreground">Qty</Label>
                   </div>
                   <div className="w-[calc(theme(spacing.8)+theme(spacing.2))]"></div>
                 </div>
                 <Button variant="outline" size="sm" onClick={handleAddItem} disabled={loadingProducts}>
                   <Plus className="h-4 w-4" />
                   Add
                 </Button>
               </div>
             </div>
             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
               {settlementItems.map((item, index) => (
                 <div key={index} className="flex items-center gap-2">
                   <Select
                     value={item.product_id ? String(item.product_id) : ''}
                     onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                     disabled={loadingProducts}
                   >
                     <SelectTrigger className="flex-grow max-w-[400px] h-auto py-2 pl-3 pr-2 text-left min-h-12">
                       <SelectValue placeholder={loadingProducts ? "Loading..." : "Select product"}>
                         {item.product_id ? (
                           (() => {
                             const product = products.find(p => p.id === item.product_id);
                             return product ? (
                               <div className="flex flex-col items-start">
                                 <span className="text-sm truncate">{product.name}</span>
                                 <span className="text-xs text-muted-foreground text-left">{product.code}</span>
                               </div>
                             ) : 'Select product';
                           })()
                         ) : (
                           loadingProducts ? "Loading..." : "Select product"
                         )}
                       </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
                       {productsError && <p className="text-red-500 text-xs p-2">{productsError}</p>}
                       {products.map((product) => (
                         <SelectItem key={product.id} value={String(product.id)}>
                           <div>
                             {product.name}
                             <div className="text-xs text-muted-foreground">{product.code}</div>
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <div className="relative w-24">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs">
                       ¥
                     </span>
                     <Input
                       id={`unit_price_${index}`}
                       type="number"
                       step="1"
                       min="0"
                       placeholder="Price"
                       value={item.unit_price ?? ''}
                       onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                       className="text-center pl-6 min-h-12" 
                     />
                   </div>
                   <Input
                     id={`quantity_${index}`}
                     type="number"
                     min="1"
                     placeholder="Qty"
                     value={item.quantity || ''}
                     onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                     className="w-16 min-h-12 text-center" 
                   />
                   <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-muted-foreground hover:text-destructive">
                     <Trash2 className="h-4 w-4" />
                     <span className="sr-only">Remove Item</span>
                   </Button>
                 </div>
               ))}
               {settlementItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Click ' + Add ' to add settlement items.</p>
               )}
             </div>

             <div className="space-y-2 mt-2">
               <Label htmlFor="total_amount">Total Amount</Label> 
               <div className="relative w-[120px]">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                   ¥
                 </span>
                 <Input
                   id="total_amount"
                   type="number"
                   step="1"
                   min="0"
                   placeholder="0.00"
                   className="w-[120px] min-h-10 text-center" 
                   value={newRecord.total_amount ?? ''} 
                   onChange={(e) => setNewRecord({...newRecord, total_amount: e.target.value ? Number(e.target.value) : undefined})}
                 />
               </div>
             </div>

             <div className="space-y-2 mt-4">
               <Label htmlFor="remarks">Remarks</Label>
               <Textarea
                 id="remarks"
                 placeholder="Optional remarks..."
                 value={newRecord.remarks || ''}
                 onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
             <Button 
                onClick={handleAddRecord} 
                disabled={isAddingRecord || loadingStores || loadingProducts || !newRecord.store_id || settlementItems.length === 0 || settlementItems.some(i => !i.product_id) || newRecord.total_amount === undefined}
              >
                {isAddingRecord ? "Adding..." : "Add Record"} 
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Settlement Details</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {isFetchingItems ? (
                 <div className="text-center p-4">Loading items...</div>
              ) : selectedItems.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2 px-1 pb-1 border-b">
                    <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                       <span className="w-20 text-right">Unit Price</span>
                       <span className="w-12 text-right">Qty</span>
                       <span className="w-24 text-right">Line Total</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedItems.map((item) => (
                      <div key={item.item_id} className="flex items-center justify-between py-1">
                        <div className="flex flex-col items-start flex-grow mr-2">
                           <span className="text-sm font-medium truncate" title={item.products?.sku_name ? item.products.sku_name : `Product ID: ${item.product_id}`}>
                             {item.products?.sku_name ? item.products.sku_name : `Product ID: ${item.product_id}`}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {item.products?.sku_code ? item.products.sku_code : '-'}
                           </span>
                         </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="w-20 text-right">{formatCurrency(item.price)}</span>
                          <span className="w-12 text-right">{item.quantity}</span>
                          <span className="w-24 text-right font-medium">{formatCurrency(item.quantity * item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t flex justify-end items-center font-semibold">
                    <span className="mr-2 py-2">Total:</span>
                    <span>
                      {formatCurrency(
                        selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">No items found for this settlement.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
       </Dialog>

       <EditSettlementDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          settlementData={recordToEdit}
          products={products}
          stores={stores.map(s => ({ store_id: s.store_id, store_name: s.store_name }))}
          loading={isEditingRecord}
          error={editError}
          onSave={handleUpdateRecord}
       />
    </Card>
  );
}