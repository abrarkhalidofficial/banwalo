'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, ArrowLeft, Edit, Package as PackageIcon, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { toast } from 'react-hot-toast';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString();
};

export default function MaterialDetailPage() {
  const params = useParams();

  const router = useRouter();

  const materialId = params.id as Id<'materials'>;

  const material = useQuery(api.materials.getById, { id: materialId });
  const stockEntries = useQuery(api.stockEntries.getByMaterial, { materialId }) || [];
  const usageHistory = useQuery(api.materials.getMaterialUsageHistory, { materialId }) || [];
  const deleteMaterial = useMutation(api.materials.remove);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleDeleteMaterial = async () => {
    try {
      await deleteMaterial({ id: materialId });
      toast.success('Material deleted successfully!');
      router.push('/dashboard/materials');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error deleting material: ${errorMessage}`);
      console.error('Error deleting material:', error);
    }
  };

  if (!material) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/materials')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Materials
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const totalStock = stockEntries.reduce((total, entry) => total + entry.remainingQuantity, 0);
  const isLowStock = material?.lowStockThreshold && totalStock <= material?.lowStockThreshold;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard/materials')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Materials
          </Button>
          <h1 className="text-3xl font-bold">{material.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/dashboard/materials/${materialId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Material
          </Button>
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete Material
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the material and all associated stock entries and usage history.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMaterial}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Material Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200">
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900 col-span-2">{material.name}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900 col-span-2">{material.type}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 col-span-2">{material.description || '-'}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Low Stock Threshold</dt>
                <dd className="text-sm text-gray-900 col-span-2">{material.lowStockThreshold ? `${material.lowStockThreshold} units` : 'Not set'}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatDate(material._creationTime)}</dd>
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
              <div className={`text-4xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                {totalStock}
                {isLowStock && <AlertTriangle className="inline-block ml-2 h-5 w-5 text-red-500" />}
              </div>
              <div className="text-sm text-gray-500">Total Units Available</div>

              {isLowStock && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                  Low stock alert! Current stock is below the threshold of {material.lowStockThreshold} units.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button className="w-full" onClick={() => router.push('/dashboard/stock/new')}>
                <PackageIcon className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consumption History</CardTitle>
          <CardDescription>Usage history across productions</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-4">Consumption History for {material.name}:</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Production</TableHead>
                <TableHead>Date Used</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg Cost</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No consumption history for this material yet.
                  </TableCell>
                </TableRow>
              ) : (
                usageHistory.map((usage) => (
                  <TableRow key={usage.productionId} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/production/${usage.productionId}`)}>
                    <TableCell className="font-medium">{usage.productionName}</TableCell>
                    <TableCell>{formatDate(usage.dateUsed)}</TableCell>
                    <TableCell>{usage.quantity}</TableCell>
                    <TableCell>PKR {(usage.averageCost || 0).toFixed(2)}/unit</TableCell>
                <TableCell>PKR {(usage.totalCost || 0).toFixed(2)}</TableCell>
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
