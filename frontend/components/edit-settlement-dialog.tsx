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
  products?: {
    product_id: number; // Use product_id
    sku_name: string;   // Use sku_name
    sku_code: string;   // Use sku_code
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
     const calculatedTotal = items.reduce((sum, item) => {
       const quantity = item.quantity || 0;
       const price = item.unit_price || 0;
       return sum + (quantity * price);
     }, 0);
     // Always update the total amount based on items
     setTotalAmount(calculatedTotal);
   }, [items]); // Update whenever items change

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

             {/* --- Settlement Items Section --- */}
             <div className="mt-4">
               <div className="flex items-center justify-between mb-2">
                 <Label className="text-base font-medium">Settlement Items</Label>
                 {/* Adjust layout for proper label alignment */}
                 <div className="flex items-center gap-1">
                    {/* Div to hold labels, aligned with inputs below */}
                    <div className="flex items-center justify-end gap-8.5 text-sm font-medium text-muted-foreground mr-1" style={{ width: 'calc(theme(spacing.24) + theme(spacing.16) + theme(spacing.2))' }}> {/* Match input widths (w-24 + w-16 + gap-2) roughly */}
                      <span className="w-22 text-right">Unit Price</span>
                      <span className="w-1 text-right">Qty</span>
                    </div>
                    {/* Placeholder for delete button width */}
                    <div className="w-[calc(theme(spacing.8)+theme(spacing.2))]"></div> {/* Approx width of Trash icon button */}
                   <Button variant="outline" size="sm" onClick={handleAddItem} disabled={loading || products.length === 0}>
                     <Plus className="h-4 w-4" />
                     Add
                   </Button>
                 </div>
               </div>
               {/* Use max-h and overflow-auto like Add Dialog */}
               <div className="space-y-3 max-h-[200px] overflow-y-auto pr-3"> {/* Match Add Form's height/scroll behavior */}
                  {items.map((item, index) => (
                     <div key={item.item_id ?? `new-${index}`} className="flex items-center gap-2"> {/* Use item_id or index for key */}
                       {/* Product Select - Apply Add Form Styles */}
                       <Select
                         value={item.product_id ? String(item.product_id) : ''}
                         onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                       >
                         <SelectTrigger className="flex-grow max-w-[400px] h-auto py-2 pl-3 pr-2 text-left min-h-12"> {/* Match Add Form */}
                           <SelectValue placeholder={"Select product"}>
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
                               // loadingProducts ? "Loading..." : "Select product"
                                "Select product"
                             )}
                           </SelectValue>
                         </SelectTrigger>
                         <SelectContent>
                           {/* {productsError && <p className="text-red-500 text-xs p-2">{productsError}</p>} */}
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
                       {/* Unit Price Input - Apply Add Form Styles */}
                       <div className="relative w-24"> {/* Match Add Form (w-24) */}
                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs"> {/* Adjusted padding for consistency */}
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
                           className="text-center pl-6 min-h-12" // Match Add Form (pl-6, min-h-12)
                         />
                       </div>
                       {/* Quantity Input - Apply Add Form Styles */}
                       <Input
                         id={`edit_quantity_${index}`}
                         type="number"
                         min="1"
                         placeholder="Qty"
                         value={item.quantity || ''}
                         onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                         className="w-16 min-h-12 text-center" // Match Add Form (min-h-12)
                       />
                       {/* Remove Button - Styles should already match */}
                       <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-muted-foreground hover:text-destructive">
                         <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Remove Item</span>
                       </Button>
                     </div>
                   ))}
                   {items.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-2">Click ' + Add ' to add settlement items.</p>
                   )}
               </div> {/* Closing div for list container */}
             </div> {/* Closing div for item section */}

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
                   step="1" 
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