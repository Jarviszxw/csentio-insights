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
import { Plus, PenSquare, Minus } from "lucide-react";
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
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryViewContext } from './inventory-filter';
import { fetchInventoryRecords, addInventoryRecords, fetchProducts, InventoryRecord } from '@/lib/api';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Select, { SingleValue } from 'react-select';
import { Textarea } from "@/components/ui/textarea";

interface ProductSelection {
  skuName: string;
  skuCode: string;
  quantity: number;
}

interface SelectOption {
  value: string;
  label: string;
}

export function InventoryRecordsTable() {
  const queryClient = useQueryClient();
  const { storeId, stores, isLoading: storesLoading } = React.useContext(InventoryViewContext);

  const filteredStores = Array.isArray(stores) ? stores.filter((s) => s.id !== 'all') : [];

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['inventoryRecords', storeId],
    queryFn: () => fetchInventoryRecords(storeId),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const addMutation = useMutation({
    mutationFn: addInventoryRecords,
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data is fetched
      queryClient.invalidateQueries({ queryKey: ['inventoryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryDistribution'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddDialogOpen(false);
      setProductSelections([{ skuName: '', skuCode: '', quantity: 1 }]);
      setStore(storeId === 'all' ? filteredStores[0]?.id || '' : storeId);
      setRemarks('');
      setInventoryDate(new Date());
      setRecordType('inventory');
    },
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<InventoryRecord | null>(null);
  const [productSelections, setProductSelections] = React.useState<ProductSelection[]>([{ skuName: '', skuCode: '', quantity: 1 }]);
  const [inventoryDate, setInventoryDate] = React.useState<Date | undefined>(new Date());
  const [store, setStore] = React.useState<string>(storeId === 'all' ? filteredStores[0]?.id || '' : storeId);
  const [remarks, setRemarks] = React.useState<string>('');
  const [trackingNo, setTrackingNo] = React.useState<string>('');
  const [recordType, setRecordType] = React.useState<'inventory' | 'sample'>('inventory');

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const currentRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleProductChange = (index: number, selectedOption: SingleValue<SelectOption>) => {
    const newSelections = [...productSelections];
    const product = products.find((p: any) => p.name === selectedOption?.value);
    newSelections[index] = {
      ...newSelections[index],
      skuName: product?.name || '',
      skuCode: product?.code || '',
    };
    setProductSelections(newSelections);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const newSelections = [...productSelections];
    const quantity = value === '' ? 0 : parseInt(value) || 0;
    newSelections[index].quantity = quantity;
    setProductSelections(newSelections);
  };

  const handleAddRecord = () => {
    const newRecords = productSelections
      .filter((ps) => ps.skuName)
      .map((ps) => ({
        store,
        skuName: ps.skuName,
        skuCode: ps.skuCode,
        quantity: ps.quantity,
        remarks,
        createdBy: 'Current User',
        inventory_date: inventoryDate ? format(inventoryDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
        type: recordType,
      }));
    addMutation.mutate(newRecords);
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
        {recordsLoading ? (
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
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-8 inline-block" /></TableCell>
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
                {currentRecords.map((record: InventoryRecord) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.createTime), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.inventory_date), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.store || 'N/A'}</Badge>
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
                      {currentPage > 1 && (
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      )}
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
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
                      {currentPage < totalPages && (
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>New Inventory Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inventory_date">Date</Label>
                <DatePicker
                  date={inventoryDate}
                  setDate={setInventoryDate}
                  className="w-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <ShadcnSelect value={store} onValueChange={setStore} disabled={storesLoading || storeId !== 'all'}>
                  <SelectTrigger id="store">
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
              <Label>Record Type</Label>
              <ShadcnSelect value={recordType} onValueChange={(value) => setRecordType(value as 'inventory' | 'sample')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                </SelectContent>
              </ShadcnSelect>
            </div>

            <div className="space-y-2">
              <Label>Products List</Label>
              {productsLoading ? (
                <div className="text-muted-foreground">Loading products list...</div>
              ) : (
                <ScrollArea className="max-h-[210px] pr-4">
                  {productSelections.map((selection, index) => (
                    <div key={index} className="grid grid-cols-[1fr_80px_40px] items-center gap-2 mb-3 w-full">
                      <Select
                        options={products.map((p: any) => ({
                          value: p.name,
                          label: `${p.name} (${p.code})`,
                        }))}
                        value={
                          selection.skuName
                            ? { value: selection.skuName, label: `${selection.skuName} (${selection.skuCode})` }
                            : null
                        }
                        onChange={(option: SingleValue<SelectOption>) => handleProductChange(index, option)}
                        placeholder="Select product"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.375rem',
                            borderColor: 'hsl(var(--input))',
                            padding: '0.1rem',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: 'hsl(var(--input))',
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.375rem',
                            maxWidth: '100%',
                            zIndex: 50,
                          }),
                          option: (base, { isFocused }) => ({
                            ...base,
                            backgroundColor: isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            padding: '8px 12px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }),
                          singleValue: (base) => ({
                            ...base,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                          }),
                        }}
                        formatOptionLabel={(option: SelectOption) => (
                          <div className="flex flex-col">
                            <span>{option.value}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.label.match(/\(([^)]+)\)/)?.[1]}
                            </span>
                          </div>
                        )}
                      />
                      <Input
                        type="number"
                        min="0"
                        value={selection.quantity === 0 ? '' : selection.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="text-center border"
                        placeholder="0"
                      />
                      {productSelections.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveProductSelection(index)}
                          className="h-8 w-8"
                        >
                          <Minus className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleAddProductSelection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </ScrollArea>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_no">Tracking No.</Label>
              <Input
                id="tracking_no"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="h-10 min-h-[2.5rem]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord} disabled={productSelections.every((ps) => !ps.skuName) || !store}>
              Add Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}