"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

// Define the store data structure (shared between StoreList and MapComponents)
interface StoreDetails {
  store_name: string;
  contract_info?: string;
  contract_file_url?: string;
}

interface StoreDetailsDialogProps {
  store: StoreDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreDetailsDialog({ store, open, onOpenChange }: StoreDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit min-w-[300px] p-4">
        <DialogHeader className="relative">
          <DialogTitle>{store?.store_name}</DialogTitle>
          <DialogDescription>Store Details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Contract Info</h4>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground px-[2px]">
                {store?.contract_info || "No contract Info yet"}
              </p>
            </div>
          </div>
          {store?.contract_file_url && (
            <div>
              <h4 className="text-sm font-medium mb-1">Contract File</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={store.contract_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {store.contract_file_url.split('/').pop()}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}