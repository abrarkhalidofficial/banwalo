import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface ProfitableProduction {
  _id: Id<"productions">;
  articleName: string;
  clientName: string;
  profit: number | null;
}

export function MostProfitableProductionsCard() {
  const profitableProductions = useQuery(
    api.analytics.getMostProfitableProductions,
    { limit: 5 }
  );

  if (profitableProductions === undefined) {
    return <Card><CardHeader><CardTitle>Most Profitable Productions</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Most Profitable Productions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {profitableProductions.length > 0 ? (
            profitableProductions.map((production) => (
              <li key={production._id.toString()} className="flex justify-between items-center">
                <span>{production.articleName} ({production.clientName})</span>
                <span className="font-medium">{formatCurrency(production.profit || 0)}</span>
              </li>
            ))
          ) : (
            <p>No profitable productions found.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}