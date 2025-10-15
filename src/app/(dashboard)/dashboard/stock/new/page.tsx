"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

interface Material {
  _id: Id<"materials">;
  name: string;
  type: string;
}

interface Supplier {
  _id: Id<"suppliers">;
  name: string;
}

interface FormData {
  materialId: string;
  supplierId: string;
  quantity: string;
  pricePerUnit: string;
  notes: string;
}

export default function AddStockPage() {
  const router = useRouter();
  const createStockEntry = useMutation(api.stockEntries.create);
  const materials = useQuery(api.materials.list) || [];
  const suppliers = useQuery(api.suppliers.list) || [];
  
  const [formData, setFormData] = useState<FormData>({
    materialId: "",
    supplierId: "",
    quantity: "",
    pricePerUnit: "",
    notes: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createStockEntry({
        materialId: formData.materialId as Id<"materials">,
        supplierId: formData.supplierId as Id<"suppliers">,
        quantity: parseInt(formData.quantity),
        remainingQuantity: parseInt(formData.quantity), // Initially, remaining = total
        pricePerUnit: parseFloat(formData.pricePerUnit),
        notes: formData.notes || undefined,
        dateReceived: Date.now(),
      });
      
      router.push("/dashboard/stock");
    } catch (error) {
      console.error("Error creating stock entry:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Add Stock</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Stock Entry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="materialId">Material *</Label>
              <select
                id="materialId"
                name="materialId"
                value={formData.materialId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a material</option>
                {materials.map((material) => (
                  <option key={material._id} value={material._id}>
                    {material.name} ({material.type})
                  </option>
                ))}
              </select>
              {materials.length === 0 && (
                <p className="text-sm text-yellow-600">
                  No materials found. Please add materials first.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-sm text-yellow-600">
                  No suppliers found. Please add suppliers first.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity received"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price Per Unit *</Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={handleChange}
                placeholder="Enter price per unit"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes about this stock entry"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/stock")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Stock"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}