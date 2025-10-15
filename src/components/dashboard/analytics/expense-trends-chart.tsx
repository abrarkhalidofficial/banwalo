import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface Expense {
  _id: Id<"expenses">;
  timestamp: number;
  amount: number;
}

export function ExpenseTrendsChart() {
  const now = Date.now();
  const oneMonthAgo = subMonths(now, 1);
  const start = startOfMonth(oneMonthAgo).getTime();
  const end = endOfMonth(now).getTime();

  const expenses = useApiQuery<typeof api.analytics.getExpensesOverTime, { start: number; end: number }, Expense[]>(
    api.analytics.getExpensesOverTime,
    { start, end }
  );

  if (expenses === undefined) {
    return <Card className="col-span-2"><CardHeader><CardTitle>Expense Trends</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
  }

  // Placeholder for chart implementation
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Expense Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Expense data for the last month:</p>
        <ul>
          {expenses.map((expense) => (
            <li key={expense._id.toString()}>
              {format(expense.timestamp, "MMM dd, yyyy")}: {expense.amount}
            </li>
          ))}
        </ul>
        <p>Chart will go here.</p>
      </CardContent>
    </Card>
  );
}