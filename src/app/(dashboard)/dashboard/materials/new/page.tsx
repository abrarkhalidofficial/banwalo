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
import { toast } from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";

interface FormData {
  name: string;
  type: string;
  description: string;
  lowStockThreshold: string;
}

interface CreateMaterialArgs {
  name: string;
  type: string;
  description?: string;
  lowStockThreshold?: number;
}

export default function NewMaterialPage() {
  const router = useRouter();
  const createMaterial = useMutation<CreateMaterialArgs, Id<"materials">>(api.materials.create);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    description: "",
    lowStockThreshold: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.name || !formData.type) {
      toast.error("Material name and type are required");
      setIsSubmitting(false);
      return;
    }

    const lowStockThreshold = formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined;
    if (formData.lowStockThreshold && isNaN(lowStockThreshold!)) {
      toast.error("Low stock threshold must be a valid number");
      setIsSubmitting(false);
      return;
    }
    
    try {
      await createMaterial({
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        lowStockThreshold,
      });
      
      toast.success("Material created successfully");
      router.push("/dashboard/materials");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error creating material:", error);
      toast.error(`Failed to create material: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">New Material</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter material name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Material Type *</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Enter material type (e.g., Fabric, Thread, Button)"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter material description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                placeholder="Enter minimum quantity before alert"
              />
              <p className="text-sm text-muted-foreground">
                Set a threshold to receive low stock alerts when inventory falls below this level
              </p>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/materials")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Material"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}