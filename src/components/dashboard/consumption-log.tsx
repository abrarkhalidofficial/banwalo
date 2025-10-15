"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";


const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ConsumptionLog({ stockEntryId }: { stockEntryId: Id<"stockEntries"> }) {
  const consumptionLog = useQuery(
    api.stockEntries.getConsumptionHistory,
    { stockEntryId }
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Consumption History</CardTitle>
      </CardHeader>
      <CardContent>
        {!consumptionLog || consumptionLog.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No consumption records found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Production ID</TableHead>
                <TableHead className="text-right">Quantity Used</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptionLog.map((record) => (
                <TableRow key={record._id.toString()}>
                  <TableCell>{formatDate(record.dateConsumed)}</TableCell>
                  <TableCell>{record.productionId?.toString()}</TableCell>
                  <TableCell className="text-right">{record.quantityUsed}</TableCell>
                  <TableCell>{record.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}