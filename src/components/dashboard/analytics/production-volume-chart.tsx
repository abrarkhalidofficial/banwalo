import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface Production {
  _id: Id<"productions">;
  timestamp: number;
}

export function ProductionVolumeChart() {
  const now = Date.now();
  const oneMonthAgo = subMonths(now, 1);
  const start = startOfMonth(oneMonthAgo).getTime();
  const end = endOfMonth(now).getTime();

  const productions = useQuery(
    api.analytics.getProductionVolumeOverTime,
    { start, end }
  );

  if (productions === undefined) {
    return <Card><CardHeader><CardTitle>Production Volume</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
  }

  // Basic aggregation for demonstration. A real chart would use a charting library.
  const monthlyProduction = productions.reduce((acc, production) => {
    const month = format(production.timestamp, "MMM yyyy");
    acc[month] = (acc[month] || 0) + 1; // Count productions per month
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Production Volume (Last Month)</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(monthlyProduction).length > 0 ? (
          <ul className="space-y-1">
            {Object.entries(monthlyProduction).map(([month, count]) => (
              <li key={month} className="text-sm">
                {month}: {count} productions
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">No productions in the last month.</p>
        )}
        {/* Placeholder for a charting library */}
        <div className="h-[200px] w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md mt-4">
          <p className="text-muted-foreground">Chart Placeholder</p>
        </div>
      </CardContent>
    </Card>
  );
}