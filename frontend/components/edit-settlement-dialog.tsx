"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Import DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns"; // Import parseISO for date parsing
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interfaces matching those in settlement-records-table or backend models
// Simplified Product for selection
interface Product {
  id: number;
  name: string;
  code: string;
  price?: number;
}

// Simplified Store for selection
interface Store {
  store_id: number;
  store_name: string;
}

// Backend response structure (for initial data)
interface SettlementItemDB {
  item_id: number;
  settlement_id: number;
  product_id: number;
  quantity: number;
  price: number; // Price from DB
  products?: { // Nested product info
    id: number;
    name: string;
    code: string;
  }
}

interface SettlementResponse {
  settlement_id: number;
  settle_date: string; // Assuming string (e.g., ISO format) from backend
  store_id: number;
  total_amount: number;
  remarks: string | null;
  created_by: string | null;
  items: SettlementItemDB[];
}

// Form state for items within the dialog
interface EditSettlementItemForm {
  item_id?: number | null; // Keep track of original ID for updates
  product_id?: number;
  quantity?: number;
  unit_price?: number; // Use unit_price in the form
}

// Structure expected by the PUT request (subset of backend models)
interface SettlementItemUpdatePayload {
  item_id?: number | null; // ID for existing items, null/undefined for new
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SettlementUpdatePayload {
  settle_date: string;
  store_id: number;
  total_amount: number;
  remarks: string | null;
  items: SettlementItemUpdatePayload[];
}


interface EditSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlementData: SettlementResponse | null; // Data to edit
  products: Product[]; // List of available products
  stores: Store[]; // List of available stores
  loading: boolean; // Loading state for fetching/saving
  error: string | null; // Error message
  onSave: (updatedData: SettlementUpdatePayload) => Promise<void>; // Save callback
}

export function EditSettlementDialog({
  open,
  onOpenChange,
  settlementData,
  products = [],
  stores = [],
  loading,
  error,
  onSave,
}: EditSettlementDialogProps) {

  // Internal state for the form
  const [settleDate, setSettleDate] = useState<Date | undefined>(undefined);
  const [storeId, setStoreId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number | string>(''); // Use string to handle intermediate input
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<EditSettlementItemForm[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Effect to initialize form state when settlementData changes
  useEffect(() => {
    if (settlementData && open) {
      console.log("Initializing Edit Dialog state with:", settlementData);
      try {
        // Attempt to parse the date string
         const parsedDate = settlementData.settle_date ? parseISO(settlementData.settle_date) : new Date();
         setSettleDate(parsedDate);
      } catch (e) {
         console.error("Failed to parse settle_date:", settlementData.settle_date, e);
         setSettleDate(new Date()); // Fallback to today if parsing fails
      }
      setStoreId(String(settlementData.store_id || ''));
      setTotalAmount(settlementData.total_amount ?? '');
      setRemarks(settlementData.remarks || '');

      // Map backend items (SettlementItemDB) to frontend form items (EditSettlementItemForm)
      const initialItems = settlementData.items?.map(dbItem => ({
        item_id: dbItem.item_id, // Keep the original item_id
        product_id: dbItem.product_id,
        quantity: dbItem.quantity,
        unit_price: dbItem.price // Map db 'price' to form 'unit_price'
      })) || [];
      setItems(initialItems);

    } else if (!open) {
      // Optional: Reset state when dialog closes
      // setSettleDate(undefined);
      // setStoreId('');
      // setTotalAmount('');
      // setRemarks('');
      // setItems([]);
    }
  }, [settlementData, open]);

  // Recalculate total amount based on items (similar to add dialog)
   useEffect(() => {
     // Only calculate if totalAmount wasn't manually set differently
     // Or always calculate and make the input readOnly? Let's keep it editable for now.
     const calculatedTotal = items.reduce((sum, item) => {
       const quantity = item.quantity || 0;
       const price = item.unit_price || 0;
       return sum + (quantity * price);
     }, 0);
     // Check if the current totalAmount (if a number) matches the calculated one
     const currentTotalNum = typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount));
      // Update only if they differ significantly to avoid overriding user input immediately
     if (Math.abs(currentTotalNum - calculatedTotal) > 0.001 || isNaN(currentTotalNum)) {
       // setTotalAmount(calculatedTotal); // This overwrites manual input. Let's comment out for now.
     }
   }, [items]); // Dependency on items, maybe not on totalAmount state itself

  // --- Item Handlers ---
  const handleAddItem = () => {
    setItems([...items, { product_id: undefined, quantity: 1, unit_price: 0, item_id: null }]); // Add item_id: null for new items
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof EditSettlementItemForm, value: any) => {
    const updatedItems = [...items];
    let numValue: number | undefined;
    let targetValue: any = value;

    // Convert numeric fields
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
       if (value === '' || value === null || value === undefined) {
           numValue = undefined;
           targetValue = undefined; // Store undefined for empty numeric fields
       } else {
           numValue = Number(value);
           if (isNaN(numValue)) numValue = undefined; // Invalid number becomes undefined
           targetValue = numValue; // Store the number
       }
       // Apply constraints
       if (field === 'quantity' && numValue !== undefined) targetValue = Math.max(1, numValue);
       if (field === 'unit_price' && numValue !== undefined) targetValue = Math.max(0, numValue);
    }

    // Create a new item object to ensure state update
    const newItem = { ...updatedItems[index], [field]: targetValue };
    updatedItems[index] = newItem;


    // Auto-fill price if product changes
    if (field === 'product_id' && typeof targetValue === 'number') {
      const selectedProduct = products.find(p => p.id === targetValue);
       console.log(`Edit: Selected product for ID ${targetValue}:`, selectedProduct);
       // Set unit_price, defaulting to 0 if not found
       newItem.unit_price = selectedProduct?.price ?? 0;
       console.log(`Edit: Set unit_price for index ${index} to: ${newItem.unit_price}`);
    }

    setItems(updatedItems);
  };


  // --- Save Handler ---
  const handleSaveChanges = () => {
    if (!settlementData) return;

    // Basic validation
    if (!storeId || !settleDate) {
       console.error("Store ID and Settle Date are required.");
       // TODO: Show validation error to user
       return;
    }
    if (items.some(item => !item.product_id || !item.quantity)) {
        console.error("All items must have a product and quantity.");
        // TODO: Show validation error to user
        return;
    }

    // Construct payload for the PUT request
    const payload: SettlementUpdatePayload = {
      settle_date: format(settleDate, 'yyyy-MM-dd'), // Format date correctly
      store_id: Number(storeId),
      total_amount: Number(totalAmount) || 0, // Ensure number
      remarks: remarks || null, // Use null if empty
      items: items.map(item => ({
        item_id: item.item_id, // Pass existing item_id or null for new items
        product_id: item.product_id!, // Assert non-null based on validation
        quantity: item.quantity!, // Assert non-null
        unit_price: item.unit_price ?? 0, // Send unit_price (backend maps to price)
      })),
    };

    console.log("Saving Settlement Update Payload:", payload);
    onSave(payload); // Call the passed save function
  };

  // --- Render ---
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px]"
         onInteractOutside={(e) => { // Keep datepicker interaction fix
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
          <DialogTitle>Edit Settlement Record</DialogTitle>
           {/* Optional: Add description */}
           <DialogDescription>
             Modify the details of this settlement record.
           </DialogDescription>
        </DialogHeader>
        {loading && !settlementData ? ( // Show loading indicator only when initially fetching data
             <div className="flex items-center justify-center p-10">Loading record details...</div>
         ) : settlementData ? ( // Render form only if data is available
           <div className="grid gap-4 py-4">
             {/* Top Row: Date, Store */}
             <div className="grid grid-cols-[200px_minmax(150px,_1fr)] gap-4 items-start"> {/* Use items-start */}
               {/* Date Picker */}
               <div className="space-y-2">
                 <Label htmlFor="settle_date_edit">Date</Label>
                 <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen} modal={true}>
                   <PopoverTrigger asChild>
                     <Button
                       id="settle_date_edit"
                       variant={"outline"}
                       className={cn(
                         "w-[180px] justify-start text-left font-normal",
                         !settleDate && "text-muted-foreground"
                       )}
                       onClick={() => setIsDatePickerOpen(true)}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {settleDate ? format(settleDate, "LLL d, y") : <span>Pick a date</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={settleDate}
                       onSelect={(date) => {
                         setSettleDate(date);
                         setIsDatePickerOpen(false);
                       }}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
               {/* Store Select */}
               <div className="space-y-2">
                 <Label htmlFor="store_edit">Store</Label>
                 <Select
                   value={storeId}
                   onValueChange={setStoreId}
                   // disabled={loadingStores} // Need loading state for stores if applicable
                 >
                   <SelectTrigger id="store_edit">
                     <SelectValue placeholder={"Select store"} />
                   </SelectTrigger>
                   <SelectContent>
                     {stores?.map((store) => (
                       <SelectItem key={store.store_id} value={String(store.store_id)}>
                         {store.store_name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>

             {/* Items Section */}
             <div className="flex justify-between items-center mt-4 mb-2 border-b pb-2">
               <Label className="text-base font-medium">Settlement Items</Label>
               <Button variant="outline" size="sm" onClick={handleAddItem} disabled={products.length === 0}>
                 <Plus className="h-4 w-4 mr-1" /> Add
               </Button>
             </div>

             {/* Items List */}
             <ScrollArea className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
               {items.map((item, index) => (
                 <div key={item.item_id ?? `new-${index}`} className="flex items-center gap-2 mb-2">
                   {/* Product Select */}
                   <Select
                     value={item.product_id ? String(item.product_id) : ''}
                     onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                     // disabled={loadingProducts} // Need product loading state
                   >
                     <SelectTrigger className="flex-grow min-w-[150px] h-auto py-2 pl-3 pr-2 text-left min-h-12">
                       <SelectValue placeholder={"Select product"}>
                         {item.product_id
                           ? products.find(p => p.id === item.product_id)?.name || 'Select product'
                           : "Select product"}
                       </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
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
                    {/* Unit Price Input */}
                   <div className="relative w-24">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs">
                        ¥
                      </span>
                     <Input
                       id={`edit_unit_price_${index}`}
                       type="number"
                       step="1"
                       min="0"
                       placeholder="Price"
                       value={item.unit_price ?? ''}
                       onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                       className="pl-6 text-sm" // Adjust padding/size
                     />
                   </div>
                    {/* Quantity Input */}
                   <Input
                     id={`edit_quantity_${index}`}
                     type="number"
                     min="1"
                     placeholder="Qty"
                     value={item.quantity || ''}
                     onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                     className="w-16 text-center text-sm"
                   />
                   {/* Remove Button */}
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => handleRemoveItem(index)}
                     className="text-muted-foreground hover:text-destructive h-8 w-8"
                     aria-label="Remove Item"
                    >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               ))}
               {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Click '+ Add' to add settlement items.</p>
               )}
             </ScrollArea>

              {/* Total Amount */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="total_amount_edit">Total Amount</Label>
                <div className="relative w-[120px]">
                   <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                     ¥
                   </span>
                  <Input
                    id="total_amount_edit"
                    type="number"
                    step="0.01" // Allow decimals for total amount
                    min="0"
                    placeholder="0.00"
                    className="pl-7 w-[120px]"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value ? e.target.value : '')} // Update string state
                  />
                </div>
              </div>

             {/* Remarks */}
             <div className="space-y-2 mt-4">
               <Label htmlFor="remarks_edit">Remarks</Label>
               <Textarea
                 id="remarks_edit"
                 placeholder="Optional remarks..."
                 value={remarks}
                 onChange={(e) => setRemarks(e.target.value)}
               />
             </div>
             {/* Display Error */}
             {error && (
                 <p className="text-sm text-destructive mt-2 text-center">Error: {error}</p>
             )}
           </div>
         ) : (
           // Show error if fetching initial data failed
           <div className="flex items-center justify-center p-10 text-destructive">
              {error || "Failed to load settlement data."}
           </div>
         )}
         {/* Footer only shown if data was loaded */}
         {settlementData && (
           <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button onClick={handleSaveChanges} disabled={loading || !settlementData}>
               {loading ? "Saving..." : "Save Changes"}
             </Button>
           </DialogFooter>
         )}
      </DialogContent>
    </Dialog>
  );
} 