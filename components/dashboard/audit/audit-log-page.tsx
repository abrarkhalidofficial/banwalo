'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export function AuditLogPage() {
  const auditLogs = useQuery(api.audit.getAuditLogs);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {auditLogs?.map((log) => (
                <div key={log._id.toString()} className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {log.actionType.toUpperCase()} on {log.entityAffected} (ID: {log.entityId})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    User: {log.userId} - Timestamp: {new Date(log._creationTime).toLocaleString()}
                  </p>
                  {log.beforeValue && <p className="text-xs text-muted-foreground">Before: {JSON.stringify(log.beforeValue)}</p>}
                  {log.afterValue && <p className="text-xs text-muted-foreground">After: {JSON.stringify(log.afterValue)}</p>}
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
