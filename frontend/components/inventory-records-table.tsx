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
  import { Plus, PenSquare } from "lucide-react";
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
  
  interface InventoryRecord {
    id: string;
    createTime: string;
    store: string;
    skuName: string;
    skuCode: string;
    quantity: number;
    trackingNo?: string;
    remarks?: string;
    createdBy: string;
  }
  
  const mockRecords: InventoryRecord[] = [
    {
      id: "INV-001",
      createTime: "2023-06-15T09:30:00Z",
      store: "Store A",
      skuName: "Product Alpha",
      skuCode: "SK-001",
      quantity: 50,
      trackingNo: "TRK-123456",
      remarks: "Regular stock refill",
      createdBy: "John Doe"
    },
    {
      id: "INV-002",
      createTime: "2023-06-16T14:20:00Z", 
      store: "Store B",
      skuName: "Product Beta",
      skuCode: "SK-002",
      quantity: 30,
      trackingNo: "TRK-789012",
      remarks: "Express delivery",
      createdBy: "Jane Smith"
    },
    {
      id: "INV-003",
      createTime: "2023-06-18T11:45:00Z",
      store: "Store A", 
      skuName: "Product Gamma",
      skuCode: "SK-003",
      quantity: 20,
      trackingNo: "TRK-345678",
      createdBy: "Alice Johnson"
    },
    {
      id: "INV-004",
      createTime: "2023-06-20T16:10:00Z",
      store: "Store C",
      skuName: "Product Delta",
      skuCode: "SK-004", 
      quantity: 15,
      remarks: "Special order",
      createdBy: "Bob Wilson"
    },
    {
      id: "INV-005",
      createTime: "2023-06-22T10:00:00Z",
      store: "Store B",
      skuName: "Product Alpha",
      skuCode: "SK-001",
      quantity: 25,
      trackingNo: "TRK-901234",
      createdBy: "Charlie Brown"
    },
    {
      id: "INV-006",
      createTime: "2023-06-25T08:30:00Z",
      store: "Store A",
      skuName: "Product Beta",
      skuCode: "SK-002",
      quantity: 40,
      trackingNo: "TRK-567890",
      remarks: "Urgent delivery",
      createdBy: "David Lee"
    },
    {
      id: "INV-007",
      createTime: "2023-06-27T13:15:00Z",
      store: "Store C",
      skuName: "Product Gamma",
      skuCode: "SK-003",
      quantity: 35,
      trackingNo: "TRK-234567",
      createdBy: "Emma Wilson"
    },
    {
      id: "INV-008",
      createTime: "2023-06-29T11:00:00Z",
      store: "Store B",
      skuName: "Product Delta",
      skuCode: "SK-004",
      quantity: 22,
      remarks: "Monthly restock",
      createdBy: "Frank Zhang"
    }
  ];
  
  export function InventoryRecordsTable() {
    const [records, setRecords] = React.useState<InventoryRecord[]>(mockRecords);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;
    
    // 按createTime从新到旧排序
    const sortedRecords = React.useMemo(() => {
      return [...records].sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    }, [records]);
    
    // 计算总页数
    const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
    
    // 获取当前页的记录
    const currentRecords = React.useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedRecords, currentPage, itemsPerPage]);
    
    // 页面变化处理函数
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    return (
      <Card className="w-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Inventory Records</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <PenSquare className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Create Time</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Tracking No.</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.createTime), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.store}</Badge>
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
                  <TableCell>
                    {record.trackingNo || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.remarks || "-"}
                  </TableCell>
                  <TableCell>{record.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    // 显示前后各一页，当前页和第一页/最后一页
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
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }