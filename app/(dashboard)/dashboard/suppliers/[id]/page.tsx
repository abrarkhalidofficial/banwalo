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
import { ArrowLeft, Edit, MapPin, Package, Phone, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';

export default function SupplierDetailPage() {
  const params = useParams();

  const router = useRouter();

  const id = params.id as Id<'suppliers'>;

  const supplier = useQuery(api.suppliers.getById, { id });

  const stockEntries = useQuery(api.stockEntries.getBySupplier, { supplierId: id }) || [];

  const deleteSupplier = useMutation(api.suppliers.remove);
  const { id: userId } = useAuth();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleDeleteSupplier = async () => {
    try {
      await deleteSupplier({ userId, id });

      toast.success('Supplier deleted successfully!');

      router.push('/dashboard/suppliers');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error) || 'Unknown error';

      toast.error(`Error deleting supplier: ${message}`);

      console.error('Error deleting supplier:', error);
    }
  };

  if (!supplier) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading supplier...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{supplier.name}</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/suppliers/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete Supplier
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier and all associated stock entries.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSupplier}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-lg">{supplier.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p className="text-lg flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                {supplier.phone}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="text-lg flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                {supplier.address}
              </p>
            </div>
            {supplier.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="text-lg">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Entries</CardTitle>
          <Button onClick={() => router.push(`/dashboard/stock/new?supplierId=${id}`)}>
            <Package className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Price Per Unit</TableHead>
                <TableHead>Date Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No stock entries from this supplier yet.
                  </TableCell>
                </TableRow>
              ) : (
                stockEntries.map((entry) => (
                  <TableRow key={entry._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/stock/${entry._id}`)}>
                    <TableCell className="font-medium">{entry.materialName}</TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>{entry.remainingQuantity}</TableCell>
                    <TableCell>${entry.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(entry.dateReceived)}</TableCell>
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
