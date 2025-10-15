"use client";

import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { ProfitThisMonthCard } from "@/components/dashboard/analytics/profit-this-month-card";
import { ProfitThisWeekCard } from "@/components/dashboard/analytics/profit-this-week-card";
import { ProfitYearToDateCard } from "@/components/dashboard/analytics/profit-year-to-date-card";
import { ExpenseTrendsChart } from "@/components/dashboard/analytics/expense-trends-chart";
import { MostProfitableProductionsCard } from "@/components/dashboard/analytics/most-profitable-productions-card";
import { InventoryOverviewCard } from "@/components/dashboard/analytics/inventory-overview-card";
import { ProductionVolumeChart } from "@/components/dashboard/analytics/production-volume-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api";
import { api } from "@/convex/_generated/api";
import { Package, Users, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportToCsv } from "@/lib/export";
import { Id } from "@/convex/_generated/dataModel";

interface Material {
  _id: Id<"materials">;
  name: string;
  description?: string;
  unit: string;
  lowStockThreshold: number;
}

interface Supplier {
  _id: Id<"suppliers">;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface StockEntry {
  _id: Id<"stockEntries">;
  materialId: Id<"materials">;
  supplierId: Id<"suppliers">;
  quantity: number;
  remainingQuantity: number;
  pricePerUnit: number;
  dateReceived: number;
  expiryDate?: number;
  batchNumber?: string;
}

interface ProfitableProduction {
  _id: Id<"productions">;
  articleName: string;
  clientName: string;
  profit: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: materials = [] } = useApiQuery(api.materials.list) as { data: Material[] };
  const { data: suppliers = [] } = useApiQuery(api.suppliers.list) as { data: Supplier[] };
  const { data: stockEntries = [] } = useApiQuery(api.stockEntries.list) as { data: StockEntry[] };
  const { data: mostProfitableProductions = [] } = useApiQuery(
    api.analytics.getMostProfitableProductions,
    { limit: 5 }
  ) as { data: ProfitableProduction[] };
  
  // Calculate total inventory value
  const totalInventoryValue = stockEntries.reduce((total, entry) => {
    return total + (entry.remainingQuantity * entry.pricePerUnit);
  }, 0);
  
  const handleExportProfitableProductions = () => {
    if (mostProfitableProductions) {
      exportToCsv("most_profitable_productions.csv", mostProfitableProductions);
    }
  };
  
  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="mb-6 w-full">
        <LowStockAlert />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        <ProfitThisMonthCard />
        <ProfitThisWeekCard />
        <ProfitYearToDateCard />
        <Card className="cursor-pointer hover:bg-muted/50 w-full" onClick={() => router.push("/dashboard/materials")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground">
              Manage your materials inventory
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 w-full" onClick={() => router.push("/dashboard/suppliers")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">
              View and manage your suppliers
            </p>
          </CardContent>
        </Card>
        
        <InventoryOverviewCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <ExpenseTrendsChart />
        <MostProfitableProductionsCard />
        <ProductionVolumeChart />
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track your recent inventory activities here.
            </p>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push("/dashboard/materials/new")}
                className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg flex flex-col items-center justify-center"
              >
                <Package className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm">Add Material</span>
              </button>
              <button 
                onClick={() => router.push("/dashboard/stock/new")}
                className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg flex flex-col items-center justify-center"
              >
                <ShoppingBag className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm">Add Stock</span>
              </button>
              <button 
                onClick={() => router.push("/dashboard/suppliers/new")}
                className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg flex flex-col items-center justify-center"
              >
                <Users className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm">Add Supplier</span>
              </button>
              <button 
                onClick={handleExportProfitableProductions}
                className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg flex flex-col items-center justify-center"
              >
                <Package className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm">Export Productions</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}