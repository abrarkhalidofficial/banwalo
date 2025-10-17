import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

import { api } from '@/convex/_generated/api';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from 'convex/react';

export function ExpenseTrendsChart() {
  const now = Date.now();

  const oneMonthAgo = subMonths(now, 1);

  const start = startOfMonth(oneMonthAgo).getTime();

  const end = endOfMonth(now).getTime();

  const expenses = useQuery(api.analytics.getExpensesOverTime, { start, end });

  if (expenses === undefined) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

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
              {format(expense._creationTime, 'MMM dd, yyyy')}: {formatCurrency(expense.amount)}
            </li>
          ))}
        </ul>
        <p>Chart will go here.</p>
      </CardContent>
    </Card>
  );
}
