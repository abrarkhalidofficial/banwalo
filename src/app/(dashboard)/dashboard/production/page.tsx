"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
import { toast } from "react-hot-toast";

interface Production {
  _id: Id<"productions">;
  articleName: string;
  clientName: string;
  type: string;
  totalPieces: number;
  cuttingDate?: number;
  status: "Planning" | "In Progress" | "Completed" | "Delivered";
  clientPrice: number;
  cuttingCost: number;
  overlockedShirtCost: number;
  overlockedTrouserCost: number;
  flatShirtCost: number;
  flatTrouserCost: number;
  singleShirtCost: number;
  singleTrouserCost: number;
  threadingCost: number;
  printingCost: number;
  pocketZipCost: number;
  doryCost: number;
  fullZipCost: number;
  elasticCost: number;
  packingZipperCost: number;
  packingShopperCost: number;
  threadCost: number;
}

// Helper function to format dates
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString();
};

export default function ProductionPage() {
  const router = useRouter();
  const productions = useQuery(api.productions.list) || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Bulk edit state
  const [editRows, setEditRows] = useState<Production[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [changedRows, setChangedRows] = useState<Record<string, Partial<Production>>>({});

  const filteredProductions = useMemo(() => {
    return productions.filter((production: Production) => {
      const matchesSearch = searchQuery
        ? production.articleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          production.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          production.type.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus = statusFilter === "all" || production.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [productions, searchQuery, statusFilter]);

  const latestFilteredProductions = useRef(filteredProductions);

  useEffect(() => {
    latestFilteredProductions.current = filteredProductions;
  }, [filteredProductions]);

  useEffect(() => {
    if (isEditing) {
      setEditRows(JSON.parse(JSON.stringify(latestFilteredProductions.current)));
    } else {
      setEditRows([]);
      setChangedRows({});
    }
  }, [isEditing]);

  const handleCellChange = (rowIdx: number, field: keyof Production, value: any) => {
    setEditRows((prev) => {
      const updated = [...prev];
      updated[rowIdx] = {
        ...updated[rowIdx],
        [field]: value,
      };
      return updated;
    });
    setChangedRows((prev) => {
      const newChangedRows = {
        ...prev,
        [editRows[rowIdx]._id]: {
          ...prev[editRows[rowIdx]._id],
          [field]: value,
        },
      };
      return newChangedRows;
    });
  };

  // Bulk save handler
  const bulkUpdateProductions = useMutation(api.productions.bulkUpdate);

  const handleBulkSave = async () => {
    try {
      const updates = Object.entries(changedRows).map(([_id, changes]) => ({
        _id: _id as Id<"productions">,
        ...changes,
      }));
      await bulkUpdateProductions({ updates });
      toast.success("Productions updated successfully!");
      setIsEditing(false);
      setChangedRows({});
      setEditRows([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Error updating productions: ${errorMessage}`);
      console.error("Error updating productions:", error);
    }
  };

  const handleBulkCancel = () => {
    setIsEditing(false);
    setEditRows([]);
    setChangedRows({});
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Productions</h1>
        <Button onClick={() => router.push("/dashboard/production/new")}> <PlusCircle className="mr-2 h-4 w-4" /> New Production </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by article name, client, or type..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Productions</CardTitle>
          <div className="flex gap-2 mt-2">
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Bulk Edit</Button>
            ) : (
              <>
                <Button variant="default" onClick={handleBulkSave}>Save All</Button>
                <Button variant="outline" onClick={handleBulkCancel}>Cancel</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Pieces</TableHead>
                <TableHead>Cutting Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client Price</TableHead>
                <TableHead>Cutting Cost</TableHead>
                <TableHead>Overlocked Shirt Cost</TableHead>
                <TableHead>Overlocked Trouser Cost</TableHead>
                <TableHead>Flat Shirt Cost</TableHead>
                <TableHead>Flat Trouser Cost</TableHead>
                <TableHead>Single Shirt Cost</TableHead>
                <TableHead>Single Trouser Cost</TableHead>
                <TableHead>Threading Cost</TableHead>
                <TableHead>Printing Cost</TableHead>
                <TableHead>Pocket Zip Cost</TableHead>
                <TableHead>Dory Cost</TableHead>
                <TableHead>Full Zip Cost</TableHead>
                <TableHead>Elastic Cost</TableHead>
                <TableHead>Packing Zipper Cost</TableHead>
                <TableHead>Packing Shopper Cost</TableHead>
                <TableHead>Thread Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={24} className="text-center py-6 text-muted-foreground">
                    {productions.length === 0 
                      ? "No productions found. Add your first production to get started."
                      : "No productions match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                (isEditing ? editRows : filteredProductions).map((production: Production, rowIdx) => (
                  <TableRow key={production._id} className={isEditing ? "" : "cursor-pointer hover:bg-muted/50"} onClick={() => !isEditing && router.push(`/dashboard/production/${production._id}`)}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input value={production.articleName} onChange={e => handleCellChange(rowIdx, "articleName", e.target.value)} />
                      ) : production.articleName}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={production.clientName} onChange={e => handleCellChange(rowIdx, "clientName", e.target.value)} />
                      ) : production.clientName}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={production.type} onChange={e => handleCellChange(rowIdx, "type", e.target.value)} />
                      ) : production.type}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.totalPieces} onChange={e => handleCellChange(rowIdx, "totalPieces", parseInt(e.target.value) || 0)} />
                      ) : production.totalPieces}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="date" value={production.cuttingDate ? new Date(production.cuttingDate).toISOString().slice(0,10) : ""} onChange={e => handleCellChange(rowIdx, "cuttingDate", e.target.value ? new Date(e.target.value).getTime() : undefined)} />
                      ) : formatDate(production.cuttingDate)}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select value={production.status} onValueChange={val => handleCellChange(rowIdx, "status", val as Production["status"])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${production.status === "Completed" || production.status === "Delivered" ? "bg-green-100 text-green-800" : production.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>{production.status}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.clientPrice} onChange={e => handleCellChange(rowIdx, "clientPrice", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.clientPrice.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.cuttingCost} onChange={e => handleCellChange(rowIdx, "cuttingCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.cuttingCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.overlockedShirtCost} onChange={e => handleCellChange(rowIdx, "overlockedShirtCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.overlockedShirtCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.overlockedTrouserCost} onChange={e => handleCellChange(rowIdx, "overlockedTrouserCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.overlockedTrouserCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.flatShirtCost} onChange={e => handleCellChange(rowIdx, "flatShirtCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.flatShirtCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.flatTrouserCost} onChange={e => handleCellChange(rowIdx, "flatTrouserCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.flatTrouserCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.singleShirtCost} onChange={e => handleCellChange(rowIdx, "singleShirtCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.singleShirtCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.singleTrouserCost} onChange={e => handleCellChange(rowIdx, "singleTrouserCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.singleTrouserCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.threadingCost} onChange={e => handleCellChange(rowIdx, "threadingCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.threadingCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.printingCost} onChange={e => handleCellChange(rowIdx, "printingCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.printingCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.pocketZipCost} onChange={e => handleCellChange(rowIdx, "pocketZipCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.pocketZipCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.doryCost} onChange={e => handleCellChange(rowIdx, "doryCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.doryCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.fullZipCost} onChange={e => handleCellChange(rowIdx, "fullZipCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.fullZipCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.elasticCost} onChange={e => handleCellChange(rowIdx, "elasticCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.elasticCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.packingZipperCost} onChange={e => handleCellChange(rowIdx, "packingZipperCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.packingZipperCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.packingShopperCost} onChange={e => handleCellChange(rowIdx, "packingShopperCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.packingShopperCost.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" value={production.threadCost} onChange={e => handleCellChange(rowIdx, "threadCost", parseFloat(e.target.value) || 0)} />
                      ) : `PKR ${production.threadCost.toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}