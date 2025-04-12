"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InventoryFilter() {
  const [view, setView] = React.useState<"total" | "by-store">("total");

  return (
    <Select value={view} onValueChange={(value: "total" | "by-store") => setView(value)}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Select View" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="total">Total</SelectItem>
        <SelectItem value="by-store">By Store</SelectItem>
      </SelectContent>
    </Select>
  );
}