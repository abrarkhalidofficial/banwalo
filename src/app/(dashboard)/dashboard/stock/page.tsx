"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, AlertTriangle, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface Material {
  _id: Id<"materials">;
  name: string;
  lowStockThreshold?: number;
}

interface StockEntry {
  _id: Id<"stockEntries">;
  _creationTime: number;
  materialId: Id<"materials">;
  materialName: string;
  quantity: number;
  remainingQuantity: number;
  pricePerUnit: number;
  dateReceived: number;
  supplierId: Id<"suppliers">;
  supplierName: string;
  material?: Material;
}

type StockStatus = "all" | "Available" | "Low Stock" | "Depleted";

export default function StockPage() {
  const router = useRouter();
  const { data: stockEntries = [] } = useQuery(api.stockEntries.list);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("all");

  const filteredStockEntries = useMemo(() => {
    return stockEntries.filter((entry) => {
      const matchesSearch = searchQuery
        ? entry.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "Depleted" && entry.remainingQuantity === 0) ||
        (statusFilter === "Low Stock" && entry.remainingQuantity > 0 && entry.remainingQuantity < entry.quantity * 0.2) ||
        (statusFilter === "Available" && entry.remainingQuantity >= entry.quantity * 0.2);

      return matchesSearch && matchesStatus;
    });
  }, [stockEntries, searchQuery, statusFilter]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StockStatus);
  };

  const handleStockEntryClick = (entryId: Id<"stockEntries">) => {
    router.push(`/dashboard/stock/${entryId}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Stock Inventory</h1>
        <Button onClick={() => router.push("/dashboard/stock/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by material or supplier..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Depleted">Depleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Price Per Unit</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {stockEntries.length === 0
                      ? "No stock entries found. Add your first stock to get started."
                      : "No stock entries match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStockEntries.map((entry) => {
                  const isLowStock = entry.material?.lowStockThreshold && 
                    entry.remainingQuantity <= entry.material.lowStockThreshold;
                  
                  return (
                    <TableRow 
                      key={entry._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStockEntryClick(entry._id)}
                    >
                      <TableCell className="font-medium">{entry.materialName}</TableCell>
                      <TableCell>{entry.quantity}</TableCell>
                      <TableCell className={isLowStock ? "text-red-500 font-medium" : ""}>
                        {entry.remainingQuantity}
                        {isLowStock && (
                          <AlertTriangle className="inline ml-2 h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>${entry.pricePerUnit.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(entry.dateReceived)}</TableCell>
                      <TableCell>{entry.supplierName}</TableCell>
                      <TableCell>
                        {entry.remainingQuantity === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Depleted
                          </span>
                        ) : entry.remainingQuantity < entry.quantity * 0.2 ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}