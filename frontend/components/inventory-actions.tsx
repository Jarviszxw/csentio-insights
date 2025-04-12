import { Button } from "@/components/ui/button";

export function InventoryActions() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => alert("Logistics Record clicked")}>
        Logistics Record
      </Button>
      <Button variant="outline" onClick={() => alert("Record Edit clicked")}>
        Record Edit
      </Button>
    </div>
  );
}