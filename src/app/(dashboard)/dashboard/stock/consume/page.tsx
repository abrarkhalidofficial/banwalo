"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { toast } from "sonner";

// Define types for stock entries
interface StockEntry {
  _id: Id<"stockEntries">;
  materialId: Id<"materials">;
  supplierId: Id<"suppliers">;
  materialName: string;
  supplierName: string;
  quantity: number;
  remainingQuantity: number;
  pricePerUnit: number;
  dateReceived: number;
  notes?: string;
}

interface FormData {
  stockEntryId: Id<"stockEntries"> | "";
  productionId: string;
  quantityUsed: string;
  notes: string;
}

export default function ConsumeStockPage() {
  const router = useRouter();
  const { data: stockEntries = [] } = useQuery(api.stockEntries.list);
  const consumeStock = useMutation(api.stockEntries.consumeStock);
  
  const [formData, setFormData] = useState<FormData>({
    stockEntryId: "",
    productionId: "",
    quantityUsed: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.stockEntryId) {
        throw new Error("Please select a stock entry");
      }
      
      if (!formData.productionId) {
        throw new Error("Please enter a production ID");
      }
      
      const quantityUsed = parseFloat(formData.quantityUsed);
      if (isNaN(quantityUsed) || quantityUsed <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      // Find the selected stock entry to check available quantity
      const selectedStock = stockEntries.find(entry => entry._id === formData.stockEntryId);
      if (!selectedStock) {
        throw new Error("Selected stock entry not found");
      }

      if (quantityUsed > selectedStock.remainingQuantity) {
        throw new Error(`Cannot consume more than available quantity (${selectedStock.remainingQuantity})`);
      }

      // Submit the form
      await consumeStock({
        stockEntryId: formData.stockEntryId,
        productionId: formData.productionId,
        quantityUsed,
        notes: formData.notes || undefined
      });

      toast.success("Stock consumption recorded successfully");
      router.push("/dashboard/stock");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred while recording consumption");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out stock entries with no remaining quantity
  const availableStockEntries = stockEntries.filter(entry => entry.remainingQuantity > 0);

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push("/dashboard/stock")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock
        </Button>
        <h1 className="text-3xl font-bold">Consume Stock</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Record Material Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="stockEntryId">Stock Entry</Label>
              <Select
                value={formData.stockEntryId.toString()}
                onValueChange={(value: string) => handleSelectChange("stockEntryId", value as Id<"stockEntries">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stock entry" />
                </SelectTrigger>
                <SelectContent>
                  {availableStockEntries.length === 0 ? (
                    <SelectItem value="none" disabled>No stock entries available</SelectItem>
                  ) : (
                    availableStockEntries.map(entry => (
                      <SelectItem key={entry._id} value={entry._id}>
                        {entry.materialName} - {entry.remainingQuantity} units (from {entry.supplierName})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionId">Production ID/Reference</Label>
              <Input
                id="productionId"
                name="productionId"
                value={formData.productionId}
                onChange={handleChange}
                placeholder="Enter production batch or order reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantityUsed">Quantity Used</Label>
              <Input
                id="quantityUsed"
                name="quantityUsed"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantityUsed}
                onChange={handleChange}
                placeholder="Enter quantity used"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes about this consumption"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/stock")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || availableStockEntries.length === 0}>
                {isSubmitting ? "Submitting..." : "Record Consumption"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}