'use client';

import { AlertTriangle, ArrowLeft, Package, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import ConsumptionLog from '@/components/dashboard/consumption-log';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function StockEntryDetailPage() {
  const params = useParams();

  const router = useRouter();

  const stockEntryId = params.id as Id<'stockEntries'>;

  const stockEntry = useQuery(api.stockEntries.getById, { id: stockEntryId });

  const consumptionHistory = useQuery(api.stockEntries.getConsumptionHistory, { stockEntryId }) ?? [];

  if (!stockEntry) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/stock')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const isLowStock = (stockEntry?.material?.lowStockThreshold ?? undefined) !== undefined && stockEntry.remainingQuantity <= (stockEntry?.material?.lowStockThreshold ?? Infinity);

  const isDepleted = stockEntry.remainingQuantity === 0;

  const handleNavigateToSupplier = (supplierId: Id<'suppliers'>) => {
    router.push(`/dashboard/suppliers/${supplierId}`);
  };

  const handleNavigateToProduction = (productionId?: Id<'productionOrders'>) => {
    if (!productionId) return;
    router.push(`/dashboard/production/${productionId}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard/stock')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock
          </Button>
          <h1 className="text-3xl font-bold">{stockEntry.materialName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200">
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Material</dt>
                <dd className="text-sm text-gray-900 col-span-2">{stockEntry.materialName}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  <button onClick={() => handleNavigateToSupplier(stockEntry.supplierId)} className="text-blue-600 hover:underline">
                    {stockEntry.supplierName}
                  </button>
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Date Received</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatDate(stockEntry.dateReceived)}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Initial Quantity</dt>
                <dd className="text-sm text-gray-900 col-span-2">{stockEntry.quantity} units</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Remaining Quantity</dt>
                <dd className={`text-sm col-span-2 ${isDepleted ? 'text-red-600 font-bold' : isLowStock ? 'text-amber-600 font-bold' : 'text-gray-900'}`}>
                  {stockEntry.remainingQuantity} units
                  {isLowStock && !isDepleted && <AlertTriangle className="inline-block ml-2 h-4 w-4 text-amber-500" />}
                  {isDepleted && <span className="ml-2 text-red-600">(Depleted)</span>}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Price Per Unit</dt>
                <dd className="text-sm text-gray-900 col-span-2">₹{(stockEntry.pricePerUnit ?? 0).toFixed(2)}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Total Value</dt>
                <dd className="text-sm text-gray-900 col-span-2">₹{(stockEntry.quantity * (stockEntry.pricePerUnit ?? 0)).toFixed(2)}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Remaining Value</dt>
                <dd className="text-sm text-gray-900 col-span-2">₹{(stockEntry.remainingQuantity * (stockEntry.pricePerUnit ?? 0)).toFixed(2)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className={`text-4xl font-bold ${isDepleted ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                {stockEntry.remainingQuantity}
                {isLowStock && !isDepleted && <AlertTriangle className="inline-block ml-2 h-5 w-5 text-amber-500" />}
              </div>
              <div className="text-sm text-gray-500">Units Remaining</div>

              {isLowStock && !isDepleted && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                  <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                  Low stock alert! Current stock is below the threshold.
                </div>
              )}

              {isDepleted && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                  Stock depleted! No units remaining.
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => router.push('/dashboard/stock/new')}>
                <Package className="mr-2 h-4 w-4" />
                Add More Stock
              </Button>

              {!isDepleted && (
                <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/stock/consume')}>
                  <Scissors className="mr-2 h-4 w-4" />
                  Consume Stock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <ConsumptionLog stockEntryId={stockEntryId} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Batch Consumption History</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-4">
            Stock Batch #{stockEntry._id.slice(-4)} - {stockEntry.materialName}
            (Initial: {stockEntry.quantity}, Remaining: {stockEntry.remainingQuantity})
          </h3>
          <h4 className="font-medium mb-2">Usage History:</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Production</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No consumption history for this stock batch yet.
                  </TableCell>
                </TableRow>
              ) : (
                consumptionHistory.map((usage) => (
                  <TableRow key={`${usage.productionId}-${usage.dateUsed}`} className="cursor-pointer hover:bg-muted/50" onClick={() => handleNavigateToProduction(usage.productionId)}>
                    <TableCell className="font-medium">{usage.productionName}</TableCell>
                    <TableCell>{formatDate(usage.dateUsed)}</TableCell>
                    <TableCell>{usage.quantityUsed}</TableCell>
                    <TableCell>₹{usage.cost.toFixed(2)}</TableCell>
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
