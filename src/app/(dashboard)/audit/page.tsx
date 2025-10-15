import { AuditLogPage } from "@/components/dashboard/audit/audit-log-page";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

export default function AuditPage() {
  return (
    <ConvexClientProvider>
      <AuditLogPage />
    </ConvexClientProvider>
  );
}