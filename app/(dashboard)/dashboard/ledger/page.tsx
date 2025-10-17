'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';

export default function LedgerPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState('');

  const expenses =
    useQuery(api.ledger.listExpenses, {
      filterDate: filterDate?.getTime(),
      filterCategory: filterCategory || undefined,
    }) || [];

  const monthlySummaries = useQuery(api.ledger.getMonthlyExpenseSummaries) || [];

  const createExpense = useMutation(api.ledger.createExpense);
  const { id: userId } = useAuth();

  const handleAddExpense = async () => {
    if (!date || !category || !amount) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      await createExpense({
        date: date.getTime(),
        category,
        amount: amountNumber,
        note: note || undefined,
        userId,
      });
      toast.success('Expense added successfully!');
      setDate(new Date());
      setCategory('');
      setAmount('');
      setNote('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error adding expense: ${errorMessage}`);
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Ledger</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label>Date</label>
                <DatePicker date={date} setDate={setDate} />
              </div>
              <div>
                <label>Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Office Supplies" />
              </div>
              <div>
                <label>Amount</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 150.00" />
              </div>
              <div>
                <label>Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
              </div>
              <Button onClick={handleAddExpense}>Add Expense</Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummaries.map((summary) => (
                    <TableRow key={`${summary.year}-${summary.month}`}>
                      <TableCell>{`${summary.year}-${String(summary.month).padStart(2, '0')}`}</TableCell>
                      <TableCell>{summary.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <DatePicker date={filterDate} setDate={setFilterDate} placeholder="Filter by Date" />
                <Input value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} placeholder="Filter by Category" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
