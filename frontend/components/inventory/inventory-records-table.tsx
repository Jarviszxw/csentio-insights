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
import { Plus, PenSquare, Minus, Trash2, Calendar as CalendarIcon, Loader2, ChevronRight, ChevronDown } from "lucide-react";
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
import { fetchInventoryRecords, addInventoryRecords, fetchProducts, InventoryRecord, updateInventoryRecord, Product as ApiProduct, StoresInfo } from '@/lib/api';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ProductSelection {
  productId: number;
  skuName: string;
  skuCode: string;
  quantity: number;
  type: 'stock' | 'sample';
}

interface SelectOption {
  value: string;
  label: string;
}

interface EditFormState {
  inventory_date?: Date;
  store_id?: number;
  productId?: number;
  skuName?: string;
  skuCode?: string;
  quantity?: number;
  type?: 'stock' | 'sample';
  remarks?: string;
  trackingNo?: string;
}

interface ShipmentGroupSummary {
  groupId: string;
  records: InventoryRecord[];
  firstRecord: InventoryRecord;
  totalQuantity: number;
  uniqueSkuCount: number;
  hasStock: boolean;
  hasSample: boolean;
}

type Product = ApiProduct;

type Store = StoresInfo;

export function InventoryRecordsTable() {
  const queryClient = useQueryClient();
  const { storeId, stores, isLoading: storesLoading } = React.useContext(InventoryViewContext);

  React.useEffect(() => {
    console.log("[InventoryTable] Stores received from context:", JSON.stringify(stores));
    console.log("[InventoryTable] Is stores loading:", storesLoading);
    console.log("[InventoryTable] Current storeId filter:", storeId);
  }, [stores, storesLoading, storeId]);

  const filteredStores = Array.isArray(stores) ? stores : [];

  const { data: records = [], isLoading: recordsLoading } = useQuery<InventoryRecord[]>({
    queryKey: ['inventoryRecords', storeId],
    queryFn: () => fetchInventoryRecords(storeId),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    select: (data) => {
      // Remove the filtering logic since the API should return valid data
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
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
  const [productSelections, setProductSelections] = React.useState<ProductSelection[]>([{ productId: 0, skuName: '', skuCode: '', quantity: 1, type: 'stock' }]);
  const [addInventoryDate, setAddInventoryDate] = React.useState<Date | undefined>(new Date());
  const [isAddDatePickerOpen, setIsAddDatePickerOpen] = React.useState(false);
  const [addStore, setAddStore] = React.useState<string>('');
  const [addRemarks, setAddRemarks] = React.useState<string>('');
  const [addTrackingNo, setAddTrackingNo] = React.useState<string>('');
  const [editFormState, setEditFormState] = React.useState<EditFormState>({});
  const [isEditDatePickerOpen, setIsEditDatePickerOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  const shipmentGroups = React.useMemo(() => {
    if (!records || records.length === 0) {
      return [];
    }

    const grouped = records.reduce((acc, record) => {
      const groupId = record.shipmentGroupId ?? `no-group-${record.id}`;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(record);
      return acc;
    }, {} as Record<string, InventoryRecord[]>);

    return Object.entries(grouped).map(([groupId, groupRecords]) => {
      const types = new Set(groupRecords.map(r => r.type));

      const hasStock = types.has('stock');
      const hasSample = types.has('sample');

      groupRecords.sort((a, b) => {
        if (a.type === 'sample' && b.type !== 'sample') return -1;
        if (a.type !== 'sample' && b.type === 'sample') return 1;
        return (a.skuCode || '').localeCompare(b.skuCode || '');
      });

      const firstRecord = groupRecords[0];
      const totalQuantity = groupRecords.reduce((sum, r) => sum + r.quantity, 0);
      const uniqueSkuCodes = new Set(groupRecords.map(r => r.skuCode));

      return {
        groupId,
        records: groupRecords,
        firstRecord,
        totalQuantity,
        uniqueSkuCount: uniqueSkuCodes.size,
        hasStock,
        hasSample,
      };
    }).sort((a, b) => {
        try {
            return new Date(b.firstRecord.inventory_date).getTime() - new Date(a.firstRecord.inventory_date).getTime();
        } catch (e) {
            return 0;
        }
    });
  }, [records]);

  const totalPages = Math.ceil(shipmentGroups.length / itemsPerPage);

  const currentGroups = shipmentGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const productsMap = React.useMemo(() => {
      if (!products) return {};
      return products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<number, Product>);
  }, [products]);

  const currentEditStateRef = React.useRef(editFormState);
  React.useEffect(() => {
    currentEditStateRef.current = editFormState;
  }, [editFormState]);

  React.useEffect(() => {
    if (selectedRecord) {
        console.log("[InventoryTable Edit Effect] Running for record:", selectedRecord.id);

        const product = products?.find(p => p.code === selectedRecord.skuCode);
        const store = stores?.find(s => s.store_name === selectedRecord.store);

        const initialState: EditFormState = {
            inventory_date: new Date(selectedRecord.inventory_date),
            store_id: store?.store_id,
            productId: product?.id !== undefined ? product.id : undefined,
            skuName: selectedRecord.skuName,
            skuCode: selectedRecord.skuCode,
            quantity: selectedRecord.quantity,
            type: selectedRecord.type,
            remarks: selectedRecord.remarks || '',
            trackingNo: selectedRecord.trackingNo || '',
        };
        console.log("[InventoryTable Edit Effect] Calculated initialState:", initialState);

        if (JSON.stringify(initialState) !== JSON.stringify(currentEditStateRef.current)) {
          console.log("[InventoryTable Edit Effect] Updating editFormState.");
          setEditFormState(initialState);
        }

    } else {
        if (Object.keys(currentEditStateRef.current).length > 0) {
          console.log("[InventoryTable Edit Effect] No selected record, clearing form state.");
          setEditFormState({});
        }
    }
  }, [selectedRecord, products, stores]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddProductSelection = () => {
    setProductSelections([...productSelections, { productId: 0, skuName: '', skuCode: '', quantity: 1, type: 'stock' }]);
  };

  const handleRemoveProductSelection = (index: number) => {
    if (productSelections.length === 1) return;
    setProductSelections(productSelections.filter((_, i) => i !== index));
  };

  const handleAddProductChange = (index: number, selectedProductId: number) => {
    const newSelections = [...productSelections];
    if (selectedProductId) {
      const product = productsMap[selectedProductId];
      if (product) {
        newSelections[index] = {
          ...newSelections[index],
          productId: selectedProductId,
          skuName: product.name || '',
          skuCode: product.code || '',
        };
      } else {
        console.warn(`Inventory: Product with ID ${selectedProductId} not found in productsMap`);
        newSelections[index] = {
          ...newSelections[index],
          productId: selectedProductId,
          skuName: `Unknown Product (${selectedProductId})`,
          skuCode: '',
        };
      }
    } else {
      newSelections[index] = {
        ...newSelections[index],
        productId: 0,
        skuName: '',
        skuCode: '',
      };
    }
    setProductSelections(newSelections);
  };

  const handleAddQuantityChange = (index: number, value: string) => {
    const newSelections = [...productSelections];
    const quantity = value === '' ? 1 : parseInt(value) || 1;
    newSelections[index].quantity = Math.max(1, quantity);
    setProductSelections(newSelections);
  };

  const handleAddItemTypeChange = (index: number, value: 'stock' | 'sample') => {
    const newSelections = [...productSelections];
    newSelections[index].type = value;
    setProductSelections(newSelections);
  };

  const handleAddRecord = () => {
    if (!addStore) {
        alert("Please select a store.");
        return;
    }
    const selectedStore = stores.find(s => String(s.store_id) === addStore);
    if (!selectedStore) {
        alert("Selected store not found.");
        return;
    }

    const newRecords = productSelections
      .filter((ps) => ps.productId && ps.quantity >= 1)
      .map((ps) => ({
        store: selectedStore.store_name,
        skuName: ps.skuName,
        skuCode: ps.skuCode,
        quantity: ps.quantity,
        remarks: addRemarks,
        trackingNo: addTrackingNo,
        createdBy: 'Current User',
        inventory_date: addInventoryDate ? format(addInventoryDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
        type: ps.type,
      }));

    if (newRecords.length === 0) {
        alert("Please add at least one valid product with quantity >= 1.");
        return;
    }
    addMutation.mutate(newRecords);
  };

  const handleEditInputChange = (field: keyof EditFormState, value: any) => {
      setEditFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleEditProductChange = (selectedProductId: number) => {
    if (selectedProductId) {
      const product = productsMap[selectedProductId];
      if (product) {
        setEditFormState(prev => ({
          ...prev,
          productId: selectedProductId,
          skuName: product.name || '',
          skuCode: product.code || '',
        }));
      } else {
        console.warn(`Inventory Edit: Product with ID ${selectedProductId} not found in productsMap`);
        setEditFormState(prev => ({
          ...prev,
          productId: selectedProductId,
          skuName: `Unknown Product (${selectedProductId})`,
          skuCode: '',
        }));
      }
    } else {
      setEditFormState(prev => ({
        ...prev,
        productId: undefined,
        skuName: '',
        skuCode: '',
      }));
    }
  };

  const handleUpdateRecord = () => {
      if (!selectedRecord) return;
      if (!editFormState.productId || !editFormState.skuCode) {
          alert("Please select a product.");
          return;
      }
       if (editFormState.quantity === undefined || editFormState.quantity < 0) {
          alert("Please enter a valid quantity (0 or greater).");
          return;
      }
       if (editFormState.store_id === undefined) {
          alert("Please select a store.");
          return;
      }

      const selectedStore = stores.find(s => s.store_id === editFormState.store_id);
      if (!selectedStore) {
         alert("Selected store not found for update.");
         return;
      }

      const dataForApi: Partial<Omit<InventoryRecord, 'id' | 'createTime' | 'is_sample'> & { inventory_date?: string, store_id?: number }> = {
          store: selectedStore.store_name,
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
      setProductSelections([{ productId: 0, skuName: '', skuCode: '', quantity: 1, type: 'stock' }]);
      const defaultStoreId = storeId === 'all' ? (filteredStores.length > 0 ? String(filteredStores[0].store_id) : '') : storeId;
      setAddStore(defaultStoreId);
      setAddRemarks('');
      setAddTrackingNo('');
      setAddInventoryDate(new Date());
      setIsAddDatePickerOpen(false);
      setIsAddDialogOpen(true);
  };

  const openEditDialog = (record: InventoryRecord) => {
      setSelectedRecord(record);
      setIsEditDatePickerOpen(false);
      setIsEditDialogOpen(true);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
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
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tracking No.</TableHead>
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
          <Table>
            <TableBody>
              <TableRow>
                 <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                   No inventory records found. Click "Add" to create a new record.
                 </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-10">Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="pl-5">Type</TableHead>
                  <TableHead>Tracking No.</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGroups.map((group) => (
                  <React.Fragment key={group.groupId}>
                    <TableRow className="cursor-pointer border-b" onClick={() => toggleGroupExpansion(group.groupId)}>
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" className="h-6 w-6">
                              {expandedGroups[group.groupId] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                           </Button>
                           {format(new Date(group.firstRecord.inventory_date), "yyyy-MM-dd")}
                         </div>
                      </TableCell>
                      <TableCell className="text-left">{group.firstRecord.store || 'N/A'}</TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                           <span className="font-normal">{`${group.uniqueSkuCount} SKU${group.uniqueSkuCount > 1 ? 's' : ''}`}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center font-normal">{group.totalQuantity}</TableCell>
                      <TableCell>
                         <div className="flex items-center justify-center gap-1">
                           {group.hasSample && (
                             <Badge variant={'secondary'} className="text-xs">
                               Sample
                             </Badge>
                           )}
                           {group.hasStock && (
                             <Badge variant={'default'} className="text-xs">
                               Stock
                             </Badge>
                           )}
                         </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-center" title={group.firstRecord.trackingNo || "-"}>
                        {group.firstRecord.trackingNo || "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-center" title={group.firstRecord.remarks || "-"}>
                        {group.firstRecord.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-center">{group.firstRecord.createdBy || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                         {/* No direct edit action for the group */}
                      </TableCell>
                    </TableRow>

                    {expandedGroups[group.groupId] && group.records.map((record) => (
                      <TableRow key={record.id} className="bg-background hover:bg-muted/30">
                        <TableCell className="pl-10">{/* Indentation */}</TableCell>
                        <TableCell>{/* Empty */}</TableCell>
                        <TableCell>
                          <span className="font-normal" title={record.skuName}>{record.skuName}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{record.skuCode}</span>
                        </TableCell>
                        <TableCell className="text-center font-normal">{record.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === 'sample' ? 'secondary' : 'default'} className="text-xs">
                            {record.type === 'sample' ? 'Sample' : 'Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(record);
                            }}
                            aria-label={`Edit record ${record.id}`}
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
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
            if (target.closest('.rdp')) { e.preventDefault(); }
          }}
          onPointerDownOutside={(e) => {
             const target = e.target as HTMLElement;
             if (target.closest('.rdp')) { e.preventDefault(); }
          }}
        >
          <DialogHeader>
            <DialogTitle>New Inventory Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[200px_minmax(150px,_1fr)] gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="add_inventory_date">Date</Label>
                 <Popover open={isAddDatePickerOpen} onOpenChange={setIsAddDatePickerOpen} modal={true}>
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
                       {addInventoryDate ? format(addInventoryDate, "LLL d, y") : <span>Pick a date</span>}
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
                <ShadcnSelect 
                  value={addStore || ''}
                  onValueChange={setAddStore} 
                  disabled={storesLoading || (storeId !== 'all' && !!storeId)}
                >
                  <SelectTrigger id="add_store">
                    <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(stores) && stores.map((s) => {
                      if (!s || s.store_id === null || s.store_id === undefined) return null;
                      return (
                        <SelectItem key={s.store_id} value={String(s.store_id)}>
                          {s.store_name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </ShadcnSelect>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <Label className="text-base font-medium flex-grow">Inventory Items</Label>
              <div className="flex items-center gap-2">
                 <div className="w-15 text-center">
                    <Label className="text-sm text-muted-foreground">Qty</Label>
                 </div>
                 <div className="w-5 text-center">
                    <Label className="text-sm text-muted-foreground">Type</Label>
                 </div>
                 <div className="w-9"></div>
                <Button variant="outline" size="sm" onClick={handleAddProductSelection} disabled={productsLoading}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
               {productsLoading ? (
                 <div className="text-muted-foreground text-center p-4">Loading products...</div>
               ) : productSelections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Click ' + Add ' to add inventory items.</p>
               ) : (
                  productSelections.map((selection, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ShadcnSelect
                         value={selection.productId ? String(selection.productId) : ''}
                        onValueChange={(value) => handleAddProductChange(index, Number(value))}
                        disabled={productsLoading}
                      >
                        <SelectTrigger className="flex-grow min-w-[150px] py-2 pl-3 pr-2 text-left min-h-12">
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
                           {products.map((product: Product) => {
                             if (!product || product.id === null || product.id === undefined || isNaN(Number(product.id))) {
                               console.warn("Inventory: Skipping rendering SelectItem for invalid product:", product);
                               return null;
                             }
                             return (
                               <SelectItem key={product.id} value={String(product.id)}>
                                 <div>
                                   {product.name}
                                   <div className="text-xs text-muted-foreground">{product.code}</div>
                                 </div>
                               </SelectItem>
                             );
                           })}
                         </SelectContent>
                      </ShadcnSelect>

                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={selection.quantity}
                        onChange={(e) => handleAddQuantityChange(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 text-center h-12"
                      />

                      <ShadcnSelect
                        value={selection.type}
                        onValueChange={(value) => handleAddItemTypeChange(index, value as 'stock' | 'sample')}
                        disabled={productsLoading}
                      >
                          <SelectTrigger className="w-[100px] h-12 min-h-12">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="sample">Sample</SelectItem>
                          </SelectContent>
                      </ShadcnSelect>

                      <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemoveProductSelection(index)}
                         disabled={productSelections.length <= 1}
                         className="text-muted-foreground hover:text-destructive w-9 h-9"
                         aria-label="Remove inventory item"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))
               )}
             </div>

            <div className="grid grid-cols-1 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="add_tracking_no">Tracking No.</Label>
                  <Input
                    id="add_tracking_no"
                    value={addTrackingNo}
                    onChange={(e) => setAddTrackingNo(e.target.value)}
                    placeholder="Optional Tracking No."
                    className="min-h-10 max-w-[300px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_remarks">Remarks</Label>
                  <Textarea
                    id="add_remarks"
                    value={addRemarks}
                    onChange={(e) => setAddRemarks(e.target.value)}
                    placeholder="Optional remarks..."
                    className="min-h-[10px]"
                  />
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord} disabled={addMutation.isPending || productSelections.some((ps) => !ps.productId || ps.quantity < 1) || !addStore || productsLoading}>
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
                if (target.closest('.rdp')) { e.preventDefault(); }
             }}
             onPointerDownOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.rdp')) { e.preventDefault(); }
             }}
        >
          <DialogHeader>
            <DialogTitle>Edit Inventory Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && !updateMutation.isPending ? (
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-[200px_minmax(150px,_1fr)] gap-4 items-start">
                  <div className="space-y-2">
                    <Label htmlFor="edit_inventory_date">Date</Label>
                    <Popover open={isEditDatePickerOpen} onOpenChange={setIsEditDatePickerOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                           id="edit_inventory_date"
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !editFormState.inventory_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormState.inventory_date ? format(editFormState.inventory_date, "LLL d, y") : <span>Pick a date</span>}
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
                        value={editFormState.store_id !== undefined ? String(editFormState.store_id) : ''}
                        onValueChange={(value) => {
                            handleEditInputChange('store_id', value ? Number(value) : undefined);
                        }}
                        disabled={storesLoading}
                    >
                      <SelectTrigger id="edit_store">
                        <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(stores) && stores.map((s) => {
                          if (!s || s.store_id === null || s.store_id === undefined) return null;
                          return (
                            <SelectItem key={s.store_id} value={String(s.store_id)}>
                              {s.store_name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                </div>

                <div className="flex items-end gap-4 mt-4 justify-left">
                  <div className="space-y-3">
                    <Label htmlFor="edit_product">Inventory Item</Label>
                    <ShadcnSelect
                      value={editFormState.productId ? String(editFormState.productId) : ''}
                      onValueChange={(value) => handleEditProductChange(Number(value))}
                      disabled={productsLoading}
                    >
                      <SelectTrigger id="edit_product" className="py-2 pl-3 pr-2 text-left h-12 min-h-12 w-[310px]">
                        <SelectValue placeholder={productsLoading ? "Loading..." : "Select product"}>
                          {editFormState.skuName ? (
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-normal">{editFormState.skuName}</span>
                              <span className="text-xs text-muted-foreground text-left">{editFormState.skuCode}</span>
                            </div>
                          ) : ( productsLoading ? "Loading..." : "Select product" )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                         {products.map((product: Product) => {
                           if (!product || product.id === null || product.id === undefined || isNaN(Number(product.id))) {
                             console.warn("Inventory: Skipping rendering SelectItem for invalid product:", product);
                             return null;
                           }
                           return (
                             <SelectItem key={product.id} value={String(product.id)}>
                               <div>
                                 {product.name}
                                 <div className="text-xs text-muted-foreground">{product.code}</div>
                               </div>
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                    </ShadcnSelect>
                  </div>

                  <div className="space-y-3 w-16">
                    <Label htmlFor="edit_quantity" className="font-normal text-muted-foreground ml-3">Qty</Label>
                    <Input
                      id="edit_quantity"
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={editFormState.quantity ?? ''}
                      onChange={(e) => handleEditInputChange('quantity', e.target.value === '' ? undefined : parseInt(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      className="text-center h-12"
                    />
                  </div>

                  <div className="space-y-3 w-[100px]">
                    <Label htmlFor="edit_type" className="font-normal text-muted-foreground ml-3">Type</Label>
                    <ShadcnSelect
                      value={editFormState.type || ''}
                      onValueChange={(value) => handleEditInputChange('type', value as 'stock' | 'sample')}
                    >
                      <SelectTrigger id="edit_type" className="h-12 min-h-12">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="sample">Sample</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_tracking_no">Tracking No.</Label>
                      <Input
                        id="edit_tracking_no"
                        value={editFormState.trackingNo || ''}
                        onChange={(e) => handleEditInputChange('trackingNo', e.target.value)}
                        placeholder="Optional Tracking No."
                        className="min-h-10 max-w-[300px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_remarks">Remarks</Label>
                      <Textarea
                        id="edit_remarks"
                        value={editFormState.remarks || ''}
                        onChange={(e) => handleEditInputChange('remarks', e.target.value)}
                        placeholder="Optional remarks..."
                        className="min-h-[10px]"
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