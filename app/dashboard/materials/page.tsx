'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MaterialsPage() {
  const router = useRouter();

  const [materialSearchTerm, setMaterialSearchTerm] = useState<string>('');

  const [stockSearchTerm, setStockSearchTerm] = useState<string>('');

  const materials = useQuery(api.materials.list) || [];

  const stockEntries = useQuery(api.stockEntries.list) || [];

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getAvailableQuantity = (materialId: Id<'materials'>): number => {
    return stockEntries.filter((entry) => entry.materialId === materialId).reduce((total, entry) => total + entry.remainingQuantity, 0);
  };

  const getStockStatus = (entry: (typeof stockEntries)[0]) => {
    if (entry.remainingQuantity === 0) return 'Depleted';
    if (entry.remainingQuantity < entry.quantity * 0.2) return 'Low';
    return 'Available';
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Depleted':
        return 'bg-red-100 text-red-800';
      case 'Low':
        return 'bg-yellow-100 text-yellow-800';
      case 'Available':
        return 'bg-green-100 text-green-800';
    }
  };

  const handleMaterialClick = (materialId: Id<'materials'>) => {
    router.push(`/dashboard/materials/${materialId}`);
  };

  const handleStockEntryClick = (stockEntryId: Id<'stockEntries'>) => {
    router.push(`/dashboard/stock/${stockEntryId}`);
  };

  const filteredMaterials = materials.filter((material) => material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));

  const filteredStockEntries = stockEntries.filter(
    (entry) => entry.materialName.toLowerCase().includes(stockSearchTerm.toLowerCase()) || entry.supplierName.toLowerCase().includes(stockSearchTerm.toLowerCase()),
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Materials</h1>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard/materials/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Material
          </Button>
          <Button onClick={() => router.push('/dashboard/stock/new')}>
            <Package className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        </div>
      </div>
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>All Materials</CardTitle>
              <Input placeholder="Search materials..." value={materialSearchTerm} onChange={(e) => setMaterialSearchTerm(e.target.value)} className="max-w-sm" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Available Quantity</TableHead>
                    <TableHead>Low Stock Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No materials found. Add your first material to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material) => (
                      <TableRow key={material._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleMaterialClick(material._id)}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.type}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{material.description || '-'}</TableCell>
                        <TableCell>{getAvailableQuantity(material._id)} units</TableCell>
                        <TableCell>{material.lowStockThreshold ? `${material.lowStockThreshold} units` : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stocks">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>All Stock Entries</CardTitle>
              <Input placeholder="Search stock entries..." value={stockSearchTerm} onChange={(e) => setStockSearchTerm(e.target.value)} className="max-w-sm" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price Per Unit</TableHead>
                    <TableHead>Date Received</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No stock entries found. Add your first stock entry to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStockEntries.map((entry) => (
                      <TableRow key={entry._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleStockEntryClick(entry._id)}>
                        <TableCell className="font-medium">{entry.materialName}</TableCell>
                        <TableCell>{entry.supplierName}</TableCell>
                        <TableCell>{entry.remainingQuantity} units</TableCell>
                        <TableCell>{entry.quantity} units</TableCell>
                        <TableCell>₹{entry.pricePerUnit}</TableCell>
                        <TableCell>{formatDate(entry.dateReceived)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyles(getStockStatus(entry))}`}>{getStockStatus(entry)}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
