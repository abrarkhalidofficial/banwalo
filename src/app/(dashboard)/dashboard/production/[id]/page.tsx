"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { toast } from "react-hot-toast";
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
} from "@/components/ui/alert-dialog";

// Helper function to format dates
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString();
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `PKR ${amount.toFixed(2)}`;
};

// Define TypeScript interfaces for the production data
interface Material {
  _id: Id<"materials">;
  materialName: string;
  materialType: string;
  quantity: number;
  pricePerUnit: number;
}

interface Production {
  _id: Id<"productions">;
  articleName: string;
  type: string;
  clientName: string;
  totalPieces: number;
  solidPieces?: number;
  status: "Planning" | "In Progress" | "Completed" | "Delivered";
  clientPrice: number;
  cuttingDate?: number;
  stitchingDate?: number;
  notes?: string;
  
  // Labor costs
  cuttingCost: number;
  overlockedShirtCost: number;
  overlockedTrouserCost: number;
  flatShirtCost: number;
  flatTrouserCost: number;
  singleShirtCost: number;
  singleTrouserCost: number;
  threadingCost: number;
  
  // Optional costs
  printingCost: number;
  pocketZipCost: number;
  doryCost: number;
  fullZipCost: number;
  elasticCost: number;
  packingZipperCost: number;
  packingShopperCost: number;
  threadCost: number;
  
  // Materials
  materials: Material[];
  
  // New fields for overhead calculation and profit
  overheadCostPerPiece: number;
  totalOverhead: number;
  finalTotalCost: number;
  totalProductionCost: number;
  profit: number;
}

export default function ProductionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<"productions">;
  
  const production = useQuery(api.productions.get, { id });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteProduction = useMutation(api.productions.remove);

  if (production === undefined) {
    return <div className="p-6">Loading production details...</div>;
  }

  if (production === null) {
    return <div className="p-6">Production not found.</div>;
  }

  const handleDeleteProduction = async () => {
    try {
      await deleteProduction({ id });
      toast.success("Production deleted successfully!");
      router.push("/dashboard/productions");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to delete production: ${errorMessage}`);
      console.error("Error deleting production:", error);
    }
  };

  const totalMaterialCost = production.materials.reduce(
    (sum, material) => sum + material.quantity * material.pricePerUnit,
    0
  );

  const totalLaborCost = (
    production.cuttingCost +
    production.overlockedShirtCost +
    production.overlockedTrouserCost +
    production.flatShirtCost +
    production.flatTrouserCost +
    production.singleShirtCost +
    production.singleTrouserCost +
    production.threadingCost
  ) * production.totalPieces;

  const totalOptionalCosts = (
    production.printingCost +
    production.pocketZipCost +
    production.doryCost +
    production.fullZipCost +
    production.elasticCost +
    production.packingZipperCost +
    production.packingShopperCost +
    production.threadCost
  ) * production.totalPieces;

  const totalProductionCost = totalMaterialCost + totalLaborCost + totalOptionalCosts;

  const finalTotalCost = production.finalTotalCost || totalProductionCost;
  const profit = production.profit || (production.clientPrice * production.totalPieces) - finalTotalCost;

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
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the production
                  and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduction}>
                  Delete
                </AlertDialogAction>
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
              <p><strong>Client:</strong> {production.clientName}</p>
              <p><strong>Article Name:</strong> {production.articleName}</p>
              <p><strong>Type:</strong> {production.type}</p>
              <p><strong>Total Pieces:</strong> {production.totalPieces}</p>
              <p><strong>Solid Pieces:</strong> {production.solidPieces || "N/A"}</p>
              <p><strong>Status:</strong> {production.status}</p>
              <p><strong>Client Price (per piece):</strong> {formatCurrency(production.clientPrice)}</p>
              <p><strong>Cutting Date:</strong> {formatDate(production.cuttingDate)}</p>
              <p><strong>Stitching Date:</strong> {formatDate(production.stitchingDate)}</p>
            </div>
            <div>
              <p><strong>Total Material Cost:</strong> {formatCurrency(totalMaterialCost)}</p>
              <p><strong>Total Labor Cost:</strong> {formatCurrency(totalLaborCost)}</p>
              <p><strong>Total Optional Costs:</strong> {formatCurrency(totalOptionalCosts)}</p>
              <p><strong>Total Production Cost:</strong> {formatCurrency(totalProductionCost)}</p>
              <p><strong>Overhead Cost Per Piece:</strong> {formatCurrency(production.overheadCostPerPiece)}</p>
              <p><strong>Total Overhead:</strong> {formatCurrency(production.totalOverhead)}</p>
              <p><strong>Final Total Cost:</strong> {formatCurrency(finalTotalCost)}</p>
              <p><strong>Profit:</strong> {formatCurrency(profit)}</p>
            </div>
          </div>
          {production.notes && (
            <div className="mt-4">
              <p><strong>Notes:</strong> {production.notes}</p>
            </div>
          )}
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
                    <TableCell>{formatCurrency(material.pricePerUnit)}</TableCell>
                    <TableCell>{formatCurrency(material.quantity * material.pricePerUnit)}</TableCell>
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
            <p><strong>Cutting Cost:</strong> {formatCurrency(production.cuttingCost)}</p>
            <p><strong>Overlocked Shirt Cost:</strong> {formatCurrency(production.overlockedShirtCost)}</p>
            <p><strong>Overlocked Trouser Cost:</strong> {formatCurrency(production.overlockedTrouserCost)}</p>
            <p><strong>Flat Shirt Cost:</strong> {formatCurrency(production.flatShirtCost)}</p>
            <p><strong>Flat Trouser Cost:</strong> {formatCurrency(production.flatTrouserCost)}</p>
            <p><strong>Single Shirt Cost:</strong> {formatCurrency(production.singleShirtCost)}</p>
            <p><strong>Single Trouser Cost:</strong> {formatCurrency(production.singleTrouserCost)}</p>
            <p><strong>Threading Cost:</strong> {formatCurrency(production.threadingCost)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}