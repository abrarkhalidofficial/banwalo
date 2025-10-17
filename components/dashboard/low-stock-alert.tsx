'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AlertTriangle } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

export function LowStockAlert() {
  const router = useRouter();

  const stockEntries = useQuery(api.stockEntries.getLowStockEntries);

  if (!stockEntries || stockEntries.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-700 flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-700 mb-4">The following materials are running low on stock:</p>
        <ul className="space-y-2">
          {stockEntries.map((entry) => (
            <li
              key={entry._id.toString()}
              className="flex justify-between items-center p-2 bg-white rounded border border-red-200 cursor-pointer hover:bg-red-50"
              onClick={() => router.push(`/dashboard/stock/${entry._id}`)}
            >
              <div>
                <span className="font-medium">{entry.materialName}</span>
                <span className="text-sm text-gray-500 ml-2">({entry.remainingQuantity} remaining)</span>
              </div>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Below threshold</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
