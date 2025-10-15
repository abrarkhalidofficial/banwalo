"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface AuditLog {
  _id: Id<"auditLogs">;
  userId: Id<"users">;
  actionType: "create" | "update" | "delete";
  entityAffected: "clients" | "materials" | "productions" | "expenses" | "suppliers" | "stockEntries";
  entityId: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  timestamp: number;
}

export default function AuditLogPage() {
  const { data: auditLogs = [] } = useQuery(api.audit.getAuditLogs) as { data: AuditLog[] };
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionTypeFilter, setActionTypeFilter] = useState<"all" | AuditLog["actionType"]>("all");

  const filteredAuditLogs = useMemo(() => {
    let filtered = auditLogs;

    if (actionTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.actionType === actionTypeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.actionType.toLowerCase().includes(query) ||
          log.entityAffected.toLowerCase().includes(query) ||
          log.entityId.toLowerCase().includes(query) ||
          (log.beforeValue && JSON.stringify(log.beforeValue).toLowerCase().includes(query)) ||
          (log.afterValue && JSON.stringify(log.afterValue).toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [auditLogs, searchQuery, actionTypeFilter]);

  const uniqueActionTypes = useMemo(() => {
    const types = new Set<AuditLog["actionType"]>();
    auditLogs.forEach((log) => types.add(log.actionType));
    return Array.from(types);
  }, [auditLogs]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Audit Log</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by action, entity, or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Select value={actionTypeFilter} onValueChange={(value: "all" | AuditLog["actionType"]) => setActionTypeFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Action Types</SelectItem>
                {uniqueActionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Entity Affected</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Before Value</TableHead>
                <TableHead>After Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuditLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{log.actionType}</TableCell>
                    <TableCell>{log.entityAffected}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell>{log.beforeValue ? JSON.stringify(log.beforeValue) : "-"}</TableCell>
                    <TableCell>{log.afterValue ? JSON.stringify(log.afterValue) : "-"}</TableCell>
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