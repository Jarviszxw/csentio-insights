// frontend/components/edit-store-form.tsx
import * as React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoreData } from './store-interfaces'; // Import shared interface
import { ContractFileComponent } from './contract-file-component'; // Import extracted component

interface EditStoreFormProps {
  selectedStore: StoreData | null;
  validationError: string | null;
  isLoading: boolean;
  onStoreNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContactInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContractInfoChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onActiveStatusChange: (checked: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  // Props for ContractFileComponent
  contractFileUrl?: string | undefined | null;
  contractFile?: File | null;
  onContractFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveContractFile: () => void;
}

export const EditStoreForm = React.memo(({
  selectedStore,
  validationError,
  isLoading,
  onStoreNameChange,
  onAddressChange,
  onContactInfoChange,
  onContractInfoChange,
  onActiveStatusChange,
  onSave,
  onCancel,
  contractFileUrl,
  contractFile,
  onContractFileChange,
  onRemoveContractFile
}: EditStoreFormProps) => {

  return (
    <>
      <ScrollArea className="max-h-[60vh] w-full pr-4">
        <div className="py-4 space-y-4">
          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="editStoreName">Store Name</Label>
            <Input
              id="editStoreName"
              placeholder="Enter store name"
              value={selectedStore?.store_name || ""}
              onChange={onStoreNameChange}
              className={validationError === "Store name is required" ? "border-destructive" : ""}
            />
            {validationError === "Store name is required" && (
              <p className="text-sm text-destructive">Store name is required</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline mb-2">
              <Label htmlFor="editAddress">Address</Label>
              <span className="text-xs text-muted-foreground mr-[12px]">(e.g., Street, City, Country)</span>
            </div>
            <Textarea
              id="editAddress"
              placeholder="Enter store address..."
              value={selectedStore?.address || ""}
              onChange={onAddressChange}
              rows={3}
              className={validationError === "Address is required" ? "border-destructive" : ""}
            />
            {validationError === "Address is required" && (
              <p className="text-sm text-destructive">Address is required</p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <Label htmlFor="editContactInfo">Contact Info</Label>
            <Input
              id="editContactInfo"
              placeholder="Enter contact information"
              value={selectedStore?.contact_info || ""}
              onChange={onContactInfoChange}
            />
          </div>

          {/* Contract Info */}
          <div className="space-y-2">
            <Label htmlFor="editContractInfo">Contract Info</Label>
            <Textarea
              id="editContractInfo"
              placeholder="Enter contract details"
              value={selectedStore?.contract_info || ""}
              onChange={onContractInfoChange}
            />
          </div>

          {/* Contract File */}
          <ContractFileComponent
             fileUrl={contractFileUrl}
             contractFile={contractFile}
             onContractFileChange={onContractFileChange}
             onRemoveContractFile={onRemoveContractFile}
           />

          {/* Active Status Switch */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="editActiveStatus"
                checked={selectedStore?.is_active ?? false} // Provide default value
                onCheckedChange={onActiveStatusChange}
              />
              <Label htmlFor="editActiveStatus" className="text-sm font-normal">
                {selectedStore?.is_active ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
});

EditStoreForm.displayName = 'EditStoreForm'; 