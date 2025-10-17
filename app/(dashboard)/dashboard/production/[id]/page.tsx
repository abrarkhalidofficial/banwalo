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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString();
};

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toFixed(2)}`;
};

export default function ProductionDetailsPage() {
  const router = useRouter();

  const params = useParams();

  const id = params.id as Id<'productions'>;

  const production = useQuery(api.productions.get, { id });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const deleteProduction = useMutation(api.productions.remove);
  const { id: userId } = useAuth();

  if (production === undefined) {
    return <div className="p-6">Loading production details...</div>;
  }

  if (production === null) {
    return <div className="p-6">Production not found.</div>;
  }

  const handleDeleteProduction = async () => {
    try {
      await deleteProduction({ userId, id });
      toast.success('Production deleted successfully!');
      router.push('/dashboard/productions');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to delete production: ${errorMessage}`);
      console.error('Error deleting production:', error);
    }
  };

  const totalMaterialCost = (production.materials || []).reduce((sum, material) => sum + material.quantity * (material.pricePerUnit ?? 0), 0);

  const totalLaborCost =
    ((production.cuttingCost ?? 0) +
      (production.overlockedShirtCost ?? 0) +
      (production.overlockedTrouserCost ?? 0) +
      (production.flatShirtCost ?? 0) +
      (production.flatTrouserCost ?? 0) +
      (production.singleShirtCost ?? 0) +
      (production.singleTrouserCost ?? 0) +
      (production.threadingCost ?? 0)) *
    (production.totalPieces ?? 0);

  const totalOptionalCosts =
    ((production.printingCost ?? 0) +
      (production.pocketZipCost ?? 0) +
      (production.doryCost ?? 0) +
      (production.fullZipCost ?? 0) +
      (production.elasticCost ?? 0) +
      (production.packingZipperCost ?? 0) +
      (production.packingShopperCost ?? 0) +
      (production.threadCost ?? 0)) *
    (production.totalPieces ?? 0);

  const totalProductionCost = totalMaterialCost + totalLaborCost + totalOptionalCosts;

  const finalTotalCost = production.finalTotalCost ?? totalProductionCost;
  const profit = production.profit ?? (production.clientPrice ?? 0) * (production.totalPieces ?? 0) - finalTotalCost;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Production: {production.articleName}</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/production/${production._id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the production and remove its data from our servers.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduction}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Client:</strong> {production.clientName}
              </p>
              <p>
                <strong>Article Name:</strong> {production.articleName}
              </p>
              <p>
                <strong>Type:</strong> {production.type}
              </p>
              <p>
                <strong>Total Pieces:</strong> {production.totalPieces}
              </p>
              <p>
                <strong>Solid Pieces:</strong> {production.solidPieces || 'N/A'}
              </p>
              <p>
                <strong>Status:</strong> {production.status}
              </p>
              <p>
                <strong>Client Price (per piece):</strong> {formatCurrency(production.clientPrice ?? 0)}
              </p>
              <p>
                <strong>Cutting Date:</strong> {formatDate(production.cuttingDate)}
              </p>
              <p>
                <strong>Stitching Date:</strong> {formatDate(production.stitchingDate)}
              </p>
            </div>
            <div>
              <p>
                <strong>Total Material Cost:</strong> {formatCurrency(totalMaterialCost)}
              </p>
              <p>
                <strong>Total Labor Cost:</strong> {formatCurrency(totalLaborCost)}
              </p>
              <p>
                <strong>Total Optional Costs:</strong> {formatCurrency(totalOptionalCosts)}
              </p>
              <p>
                <strong>Total Production Cost:</strong> {formatCurrency(totalProductionCost)}
              </p>
              <p>
                <strong>Overhead Cost Per Piece:</strong> {formatCurrency(production.overheadCostPerPiece ?? 0)}
              </p>
              <p>
                <strong>Total Overhead:</strong> {formatCurrency(production.totalOverhead ?? 0)}
              </p>
              <p>
                <strong>Final Total Cost:</strong> {formatCurrency(finalTotalCost ?? 0)}
              </p>
              <p>
                <strong>Profit:</strong> {formatCurrency(profit ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Materials Used</CardTitle>
        </CardHeader>
        <CardContent>
          {production.materials && production.materials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity Used</TableHead>
                  <TableHead>Price Per Unit</TableHead>
                  <TableHead>Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {production.materials.map((material) => (
                  <TableRow key={material._id}>
                    <TableCell>{material.materialName}</TableCell>
                    <TableCell>{material.materialType}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{formatCurrency(material.pricePerUnit ?? 0)}</TableCell>
                    <TableCell>{formatCurrency(material.quantity * (material.pricePerUnit ?? 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No materials recorded for this production.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labor Costs (Per Piece)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <strong>Cutting Cost:</strong> {formatCurrency(production.cuttingCost)}
            </p>
            <p>
              <strong>Overlocked Shirt Cost:</strong> {formatCurrency(production.overlockedShirtCost)}
            </p>
            <p>
              <strong>Overlocked Trouser Cost:</strong> {formatCurrency(production.overlockedTrouserCost)}
            </p>
            <p>
              <strong>Flat Shirt Cost:</strong> {formatCurrency(production.flatShirtCost)}
            </p>
            <p>
              <strong>Flat Trouser Cost:</strong> {formatCurrency(production.flatTrouserCost)}
            </p>
            <p>
              <strong>Single Shirt Cost:</strong> {formatCurrency(production.singleShirtCost)}
            </p>
            <p>
              <strong>Single Trouser Cost:</strong> {formatCurrency(production.singleTrouserCost)}
            </p>
            <p>
              <strong>Threading Cost:</strong> {formatCurrency(production.threadingCost)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
