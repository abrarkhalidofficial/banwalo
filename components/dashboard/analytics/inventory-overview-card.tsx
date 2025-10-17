import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { api } from '@/convex/_generated/api';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from 'convex/react';

export function InventoryOverviewCard() {
  const inventoryOverview = useQuery(api.analytics.getInventoryOverview) as
    | {
        totalInventoryValue: number;
        lowStockMaterials: {
          materialName: string;
          currentStock: number;
          threshold: number;
        }[];
      }
    | undefined;

  if (inventoryOverview === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Inventory Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl font-bold">{formatCurrency(inventoryOverview.totalInventoryValue)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Low Stock Alerts</p>
          {inventoryOverview.lowStockMaterials.length > 0 ? (
            <ul className="space-y-1">
              {inventoryOverview.lowStockMaterials.map((material, index) => (
                <li key={index} className="text-sm">
                  {material.materialName}: {material.currentStock} (Threshold: {material.threshold})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No low stock alerts.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
