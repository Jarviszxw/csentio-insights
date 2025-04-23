import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, XCircle } from "lucide-react";

interface ContractFileComponentProps {
  fileUrl?: string | undefined | null; // Accept null as well
  contractFile?: File | null;
  onContractFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveContractFile: () => void;
}

// Memoize the component for performance
export const ContractFileComponent = React.memo(({
  fileUrl,
  contractFile,
  onContractFileChange,
  onRemoveContractFile,
}: ContractFileComponentProps) => {

  // Helper to render the file info badge or placeholder
  const renderFileInfo = () => {
    const fileName = contractFile?.name || (fileUrl ? fileUrl.split('/').pop() : null);

    if (fileName) {
      return (
        <Badge variant="outline" className="flex gap-1 items-center">
          <FileText className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={fileName}>{fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the file input click
              onRemoveContractFile();
            }}
            aria-label="Remove file"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </Badge>
      );
    } else {
      return <p className="text-sm text-muted-foreground">Click to choose file</p>;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="contractFile">Contract File</Label>
      {/* Container is relative, min-height for empty state */}
      <div className="border rounded-md relative flex items-center min-h-[40px] p-2 overflow-hidden">
        {/* Custom file info display */}
        <div className="flex-grow flex flex-wrap gap-2 mr-2">
          {renderFileInfo()}
        </div>
        {/* Absolutely positioned, invisible input covering the whole area */}
        <Input
          id="contractFile"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.pages,.zip" // Consistent accepted types
          onChange={onContractFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title=" " // Attempt to override default tooltip
          aria-label="Upload Contract File"
        />
      </div>
    </div>
  );
});

ContractFileComponent.displayName = 'ContractFileComponent'; // Add display name 