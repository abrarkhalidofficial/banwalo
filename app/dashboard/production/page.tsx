"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { toast } from "react-hot-toast";
import useAuth from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString();
};

export default function ProductionPage() {
  const router = useRouter();

  const rawProductions = useQuery(api.productions.list);

  type Production = NonNullable<typeof rawProductions>[0];

  const productions = useMemo(() => rawProductions || [], [rawProductions]);

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [clientFilter, setClientFilter] = useState("all");

  const uniqueClients = useMemo(
    () =>
      Array.from(
        new Set(
          (productions || [])
            .map((p) => p.clientName)
            .filter((name): name is string => Boolean(name))
        )
      ).sort(),
    [productions]
  );

  const [timeRangeFilter, setTimeRangeFilter] = useState("last3months");

  const [editRows, setEditRows] = useState<Production[]>([]);

  const [isEditing, setIsEditing] = useState(false);

  const [changedRows, setChangedRows] = useState<
    Record<string, Partial<Production>>
  >({});

  const filteredProductions = useMemo(() => {
    const now = Date.now();
    let rangeStart: number | null = null;
    if (timeRangeFilter === "week") {
      rangeStart = now - 7 * 24 * 60 * 60 * 1000; // last 7 days
    } else if (timeRangeFilter === "last3months") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      rangeStart = d.getTime();
    } else {
      rangeStart = null; // all time
    }

    return productions.filter((production) => {
      const matchesSearch = searchQuery
        ? production.articleName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          production.clientName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          production.type.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus =
        statusFilter === "all" || production.status === statusFilter;
      const matchesClient =
        clientFilter === "all" || production.clientName === clientFilter;
      const matchesTime =
        rangeStart === null || (production.createdAt ?? 0) >= rangeStart;

      return matchesSearch && matchesStatus && matchesClient && matchesTime;
    });
  }, [productions, searchQuery, statusFilter, clientFilter, timeRangeFilter]);

  const metrics = useMemo(() => {
    const items = filteredProductions;
    const totalProductions = items.length;
    const totalPieces = items.reduce(
      (sum, p) => sum + (typeof p.totalPieces === "number" ? p.totalPieces : 0),
      0
    );
    const priceSum = items.reduce(
      (sum, p) => sum + (typeof p.clientPrice === "number" ? p.clientPrice : 0),
      0
    );
    const avgUnitPrice = totalProductions > 0 ? priceSum / totalProductions : 0;
    const completedCount = items.filter(
      (p) => p.status === "Completed" || p.status === "Delivered"
    ).length;
    const completionRate =
      totalProductions > 0 ? (completedCount / totalProductions) * 100 : 0;

    const totalProfit = items.reduce((sum, p) => {
      const pieces = typeof p.totalPieces === "number" ? p.totalPieces : 0;
      const revenuePerUnit =
        typeof p.clientPrice === "number" ? p.clientPrice : 0;
      const laborCostPerUnit =
        (p.cuttingCost ?? 0) +
        (p.overlockedShirtCost ?? 0) +
        (p.overlockedTrouserCost ?? 0) +
        (p.flatShirtCost ?? 0) +
        (p.flatTrouserCost ?? 0) +
        (p.singleShirtCost ?? 0) +
        (p.singleTrouserCost ?? 0) +
        (p.threadingCost ?? 0);

      const optionalCostPerUnit =
        (p.printingCost ?? 0) +
        (p.pocketZipCost ?? 0) +
        (p.doryCost ?? 0) +
        (p.fullZipCost ?? 0) +
        (p.elasticCost ?? 0) +
        (p.packingZipperCost ?? 0) +
        (p.packingShopperCost ?? 0) +
        (p.threadCost ?? 0);

      const profitPerUnit =
        revenuePerUnit - (laborCostPerUnit + optionalCostPerUnit);
      return sum + profitPerUnit * pieces;
    }, 0);

    return {
      totalProductions,
      totalPieces,
      avgUnitPrice,
      completedCount,
      completionRate,
      totalProfit,
    };
  }, [filteredProductions]);

  const latestFilteredProductions = useRef(filteredProductions);

  useEffect(() => {
    latestFilteredProductions.current = filteredProductions;
  }, [filteredProductions]);

  useEffect(() => {
    if (isEditing) {
      setEditRows(
        JSON.parse(JSON.stringify(latestFilteredProductions.current))
      );
    } else {
      setEditRows([]);
      setChangedRows({});
    }
  }, [isEditing]);

  const handleCellChange = (
    rowIdx: number,
    field: keyof Production,
    value: string | number | undefined
  ) => {
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

  const bulkUpdateProductions = useMutation(api.productions.bulkUpdate);
  const { id: userId } = useAuth();

  const handleBulkSave = async () => {
    try {
      const allowedKeys: (keyof Production)[] = [
        "status",
        "solidPieces",
        "cuttingDate",
        "stitchingDate",
        "notes",
        "articleName",
        "type",
        "totalPieces",
        "clientPrice",
        "cuttingCost",
        "overlockedShirtCost",
        "overlockedTrouserCost",
        "flatShirtCost",
        "flatTrouserCost",
        "singleShirtCost",
        "singleTrouserCost",
        "threadingCost",
        "printingCost",
        "pocketZipCost",
        "doryCost",
        "fullZipCost",
        "elasticCost",
        "packingZipperCost",
        "packingShopperCost",
        "threadCost",
      ];

      const updates = Object.entries(changedRows).map(([id, changes]) => {
        const filteredChanges = Object.fromEntries(
          Object.entries(changes).filter(([key]) =>
            allowedKeys.includes(key as keyof Production)
          )
        );
        return {
          _id: id as Id<"productionOrders">,
          ...filteredChanges,
        };
      });

      await bulkUpdateProductions({ userId, updates });
      toast.success("Productions updated successfully!");
      setIsEditing(false);
      setChangedRows({});
      setEditRows([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Error updating productions: ${errorMessage}`);
      console.error("Error updating productions:", error);
    }
  };

  const handleBulkCancel = () => {
    setIsEditing(false);
    setEditRows([]);
    setChangedRows({});
  };

  const ProfitPerUnitCell = ({ production }: { production: Production }) => {
    const consumptions = useQuery(
      api.productionOrders.getMaterialConsumptionsByOrder,
      {
        productionOrderId: production._id,
      }
    );
    const expenseAllocation = useQuery(
      api.productionOrders.getExpenseAllocation,
      {
        id: production._id,
      }
    );

    if (consumptions === undefined || expenseAllocation === undefined) {
      return <span className="text-muted-foreground">Loading...</span>;
    }

    const totalPieces = production.totalPieces || 0;

    const materialCost = (consumptions || []).reduce(
      (sum, c) => sum + (c.totalCost || 0),
      0
    );
    const materialCostPerUnit =
      totalPieces > 0 ? materialCost / totalPieces : 0;

    const laborCostPerUnit =
      (production.cuttingCost ?? 0) +
      (production.overlockedShirtCost ?? 0) +
      (production.overlockedTrouserCost ?? 0) +
      (production.flatShirtCost ?? 0) +
      (production.flatTrouserCost ?? 0) +
      (production.singleShirtCost ?? 0) +
      (production.singleTrouserCost ?? 0) +
      (production.threadingCost ?? 0);

    const optionalCostPerUnit =
      (production.printingCost ?? 0) +
      (production.pocketZipCost ?? 0) +
      (production.doryCost ?? 0) +
      (production.fullZipCost ?? 0) +
      (production.elasticCost ?? 0) +
      (production.packingZipperCost ?? 0) +
      (production.packingShopperCost ?? 0) +
      (production.threadCost ?? 0);

    const overheadPerUnit =
      totalPieces > 0
        ? (expenseAllocation?.allocatedExpense || 0) / totalPieces
        : 0;

    const revenuePerUnit = production.clientPrice ?? 0;

    const profitPerUnit =
      revenuePerUnit -
      (materialCostPerUnit +
        laborCostPerUnit +
        optionalCostPerUnit +
        overheadPerUnit);

    return <span>{formatCurrency(profitPerUnit)}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Productions</h1>
        <Button onClick={() => router.push("/dashboard/production/new")}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Production{" "}
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by article name, client, or type..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
        <div className="w-full md:w-[200px]">
           <Select value={clientFilter} onValueChange={setClientFilter}>
             <SelectTrigger>
               <SelectValue placeholder="Filter by client" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Clients</SelectItem>
               {uniqueClients.map((client) => (
                 <SelectItem key={client} value={client}>
                   {client}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
         <div className="w-full md:w-[200px]">
           <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
             <SelectTrigger>
               <SelectValue placeholder="Filter by time" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="week">This Week</SelectItem>
               <SelectItem value="last3months">Last 3 Months (Default)</SelectItem>
               <SelectItem value="all">All Time</SelectItem>
             </SelectContent>
           </Select>
         </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProductions}</div>
            <p className="text-xs text-muted-foreground">
              Filtered by search and status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPieces}</div>
            <p className="text-xs text-muted-foreground">
              Sum across filtered productions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Client Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.avgUnitPrice)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per-unit across filtered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedCount} completed/delivered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Productions</CardTitle>
          <div className="flex gap-2 mt-2">
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Bulk Edit
              </Button>
            ) : (
              <>
                <Button variant="default" onClick={handleBulkSave}>
                  Save All
                </Button>
                <Button variant="outline" onClick={handleBulkCancel}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {" "}
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">
                  Article Name
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Pieces</TableHead>
                <TableHead>Cutting Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client Price</TableHead>
                <TableHead>Profit per Unit</TableHead>
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
                  <TableCell
                    colSpan={24}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {productions.length === 0
                      ? "No productions found. Add your first production to get started."
                      : "No productions match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                (isEditing ? editRows : filteredProductions).map(
                  (production, rowIdx) => (
                    <TableRow
                      key={production._id}
                      className={
                        isEditing ? "" : "cursor-pointer hover:bg-muted/50"
                      }
                      onClick={() =>
                        !isEditing &&
                        router.push(`/dashboard/production/${production._id}`)
                      }
                    >
                      <TableCell className="font-medium sticky bg-background left-0  z-10 ">
                        {isEditing ? (
                          <Input
                            value={production.articleName}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "articleName",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          production.articleName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={production.clientName}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "clientName",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          production.clientName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={production.type}
                            onChange={(e) =>
                              handleCellChange(rowIdx, "type", e.target.value)
                            }
                          />
                        ) : (
                          production.type
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.totalPieces}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "totalPieces",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          production.totalPieces
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={
                              production.cuttingDate
                                ? new Date(production.cuttingDate)
                                    .toISOString()
                                    .slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "cuttingDate",
                                e.target.value
                                  ? new Date(e.target.value).getTime()
                                  : undefined
                              )
                            }
                          />
                        ) : (
                          formatDate(production.cuttingDate)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={production.status}
                            onValueChange={(val) =>
                              handleCellChange(
                                rowIdx,
                                "status",
                                val as Production["status"]
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Planning">Planning</SelectItem>
                              <SelectItem value="In Progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="Completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="Delivered">
                                Delivered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              production.status === "Completed" ||
                              production.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : production.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {production.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.clientPrice}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "clientPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.clientPrice ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        <ProfitPerUnitCell production={production} />
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.cuttingCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "cuttingCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.cuttingCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.overlockedShirtCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "overlockedShirtCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.overlockedShirtCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.overlockedTrouserCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "overlockedTrouserCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.overlockedTrouserCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.flatShirtCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "flatShirtCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.flatShirtCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.flatTrouserCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "flatTrouserCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.flatTrouserCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.singleShirtCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "singleShirtCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.singleShirtCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.singleTrouserCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "singleTrouserCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.singleTrouserCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.threadingCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "threadingCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${production.threadingCost.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.printingCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "printingCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.printingCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.pocketZipCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "pocketZipCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.pocketZipCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.doryCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "doryCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.doryCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.fullZipCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "fullZipCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.fullZipCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.elasticCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "elasticCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.elasticCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.packingZipperCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "packingZipperCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.packingZipperCost ?? 0).toFixed(
                            2
                          )}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.packingShopperCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "packingShopperCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.packingShopperCost ?? 0).toFixed(
                            2
                          )}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={production.threadCost}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                "threadCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        ) : (
                          `PKR ${(production.threadCost ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
