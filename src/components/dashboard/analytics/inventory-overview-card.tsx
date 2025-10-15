import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface LowStockMaterial {
  materialName: string;
  currentStock: number;
  threshold: number;
}

interface InventoryOverview {
  totalInventoryValue: number;
  lowStockMaterials: LowStockMaterial[];
}

export function InventoryOverviewCard() {
  const totalMaterials = useApiQuery<typeof api.analytics.getTotalMaterials, void, number>(
    api.analytics.getTotalMaterials
  );
  const totalStockValue = useApiQuery<typeof api.analytics.getTotalStockValue, void, number>(
    api.analytics.getTotalStockValue
  );
  const inventoryOverview = useApiQuery<typeof api.analytics.getInventoryOverview, void, InventoryOverview>(
    api.analytics.getInventoryOverview
  );

  if (inventoryOverview === undefined) {
    return <Card><CardHeader><CardTitle>Inventory Overview</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
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