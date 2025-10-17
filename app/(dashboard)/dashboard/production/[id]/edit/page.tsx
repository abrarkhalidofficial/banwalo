'use client';

import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';

interface FormData {
  clientId: string;
  articleName: string;
  type: string;
  totalPieces: number;
  solidPieces: number;
  cuttingDate: string;
  stitchingDate: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Delivered';
  clientPrice: number;
  cuttingCost: number;
  overlockedShirtCost: number;
  overlockedTrouserCost: number;
  flatShirtCost: number;
  flatTrouserCost: number;
  singleShirtCost: number;
  singleTrouserCost: number;
  threadingCost: number;
  printingCost: number;
  pocketZipCost: number;
  doryCost: number;
  fullZipCost: number;
  elasticCost: number;
  packingZipperCost: number;
  packingShopperCost: number;
  threadCost: number;
  materials: { materialId: string; quantity: number }[];
}

export default function EditProductionPage() {
  const params = useParams();

  const router = useRouter();

  const productionId = params.id as Id<'productions'>;

  const production = useQuery(api.productions.get, { id: productionId });

  const clients = useQuery(api.clients.list);

  const materials = useQuery(api.materials.list);

  const updateProduction = useMutation(api.productions.updateProduction);
  const { id: userId } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    articleName: '',
    type: '',
    totalPieces: 0,
    solidPieces: 0,
    cuttingDate: '',
    stitchingDate: '',
    status: 'Planning',
    clientPrice: 0,
    cuttingCost: 0,
    overlockedShirtCost: 0,
    overlockedTrouserCost: 0,
    flatShirtCost: 0,
    flatTrouserCost: 0,
    singleShirtCost: 0,
    singleTrouserCost: 0,
    threadingCost: 0,
    printingCost: 0,
    pocketZipCost: 0,
    doryCost: 0,
    fullZipCost: 0,
    elasticCost: 0,
    packingZipperCost: 0,
    packingShopperCost: 0,
    threadCost: 0,
    materials: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (production) {
      setFormData({
        clientId: (production.clientId as string) || '',
        articleName: production.articleName || '',
        type: production.type || '',
        totalPieces: production.totalPieces || 0,
        solidPieces: production.solidPieces || 0,
        cuttingDate: production.cuttingDate ? new Date(production.cuttingDate).toISOString().split('T')[0] : '',
        stitchingDate: production.stitchingDate ? new Date(production.stitchingDate).toISOString().split('T')[0] : '',
        status: (production.status as 'Planning' | 'In Progress' | 'Completed' | 'Delivered') || 'Planning',
        clientPrice: production.clientPrice ?? 0,
        cuttingCost: production.cuttingCost ?? 0,
        overlockedShirtCost: production.overlockedShirtCost ?? 0,
        overlockedTrouserCost: production.overlockedTrouserCost ?? 0,
        flatShirtCost: production.flatShirtCost ?? 0,
        flatTrouserCost: production.flatTrouserCost ?? 0,
        singleShirtCost: production.singleShirtCost ?? 0,
        singleTrouserCost: production.singleTrouserCost ?? 0,
        threadingCost: production.threadingCost ?? 0,
        printingCost: production.printingCost ?? 0,
        pocketZipCost: production.pocketZipCost ?? 0,
        doryCost: production.doryCost ?? 0,
        fullZipCost: production.fullZipCost ?? 0,
        elasticCost: production.elasticCost ?? 0,
        packingZipperCost: production.packingZipperCost ?? 0,
        packingShopperCost: production.packingShopperCost ?? 0,
        threadCost: production.threadCost ?? 0,
        materials: (production.materials || []).map((m) => ({
          materialId: m._id,
          quantity: m.quantity,
        })),
      });
    }
  }, [production]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProduction({
        id: productionId,
        userId,
        clientId: formData.clientId as Id<'clients'>,
        articleName: formData.articleName,
        type: formData.type,
        totalPieces: formData.totalPieces,
        solidPieces: formData.solidPieces,
        cuttingDate: formData.cuttingDate ? new Date(formData.cuttingDate).getTime() : undefined,
        stitchingDate: formData.stitchingDate ? new Date(formData.stitchingDate).getTime() : undefined,
        status: formData.status,
        clientPrice: formData.clientPrice,
        cuttingCost: formData.cuttingCost,
        overlockedShirtCost: formData.overlockedShirtCost,
        overlockedTrouserCost: formData.overlockedTrouserCost,
        flatShirtCost: formData.flatShirtCost,
        flatTrouserCost: formData.flatTrouserCost,
        singleShirtCost: formData.singleShirtCost,
        singleTrouserCost: formData.singleTrouserCost,
        threadingCost: formData.threadingCost,
        printingCost: formData.printingCost,
        pocketZipCost: formData.pocketZipCost,
        doryCost: formData.doryCost,
        fullZipCost: formData.fullZipCost,
        elasticCost: formData.elasticCost,
        packingZipperCost: formData.packingZipperCost,
        packingShopperCost: formData.packingShopperCost,
        threadCost: formData.threadCost,
      });

      toast.success('Production updated successfully!');
      router.push(`/dashboard/production/${productionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to update production: ${errorMessage}`);
      console.error('Error updating production:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { materialId: '', quantity: 0 }],
    }));
  };

  const updateMaterial = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  if (!production || !clients || !materials) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Production</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}>
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="articleName">Article Name</Label>
                <Input
                  id="articleName"
                  value={formData.articleName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      articleName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={formData.type} onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="totalPieces">Total Pieces</Label>
                <Input
                  id="totalPieces"
                  type="number"
                  value={formData.totalPieces}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalPieces: parseInt(e.target.value) || 0,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="solidPieces">Solid Pieces</Label>
              <Input
                id="solidPieces"
                type="number"
                value={formData.solidPieces}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    solidPieces: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cuttingDate">Cutting Date</Label>
                <Input
                  id="cuttingDate"
                  type="date"
                  value={formData.cuttingDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cuttingDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="stitchingDate">Stitching Date</Label>
                <Input
                  id="stitchingDate"
                  type="date"
                  value={formData.stitchingDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stitchingDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'Planning' | 'In Progress' | 'Completed' | 'Delivered') => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.materials.map((material, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Material</Label>
                    <Select value={material.materialId} onValueChange={(value) => updateMaterial(index, 'materialId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((mat) => (
                          <SelectItem key={mat._id} value={mat._id}>
                            {mat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Quantity</Label>
                    <Input type="number" value={material.quantity} onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 0)} required />
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => removeMaterial(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientPrice">Client Price</Label>
              <Input
                id="clientPrice"
                type="number"
                step="0.01"
                value={formData.clientPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Labor Costs (per piece)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuttingCost">Cutting Cost</Label>
              <Input
                id="cuttingCost"
                type="number"
                step="0.01"
                value={formData.cuttingCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cuttingCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="overlockedShirtCost">Overlocked Shirt Cost</Label>
              <Input
                id="overlockedShirtCost"
                type="number"
                step="0.01"
                value={formData.overlockedShirtCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    overlockedShirtCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="overlockedTrouserCost">Overlocked Trouser Cost</Label>
              <Input
                id="overlockedTrouserCost"
                type="number"
                step="0.01"
                value={formData.overlockedTrouserCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    overlockedTrouserCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="flatShirtCost">Flat Shirt Cost</Label>
              <Input
                id="flatShirtCost"
                type="number"
                step="0.01"
                value={formData.flatShirtCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatShirtCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="flatTrouserCost">Flat Trouser Cost</Label>
              <Input
                id="flatTrouserCost"
                type="number"
                step="0.01"
                value={formData.flatTrouserCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatTrouserCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="singleShirtCost">Single Shirt Cost</Label>
              <Input
                id="singleShirtCost"
                type="number"
                step="0.01"
                value={formData.singleShirtCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    singleShirtCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="singleTrouserCost">Single Trouser Cost</Label>
              <Input
                id="singleTrouserCost"
                type="number"
                step="0.01"
                value={formData.singleTrouserCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    singleTrouserCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="threadingCost">Threading Cost</Label>
              <Input
                id="threadingCost"
                type="number"
                step="0.01"
                value={formData.threadingCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    threadingCost: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional Costs (per piece)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="printingCost">Printing Cost</Label>
              <Input
                id="printingCost"
                type="number"
                step="0.01"
                value={formData.printingCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    printingCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="pocketZipCost">Pocket Zip Cost</Label>
              <Input
                id="pocketZipCost"
                type="number"
                step="0.01"
                value={formData.pocketZipCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pocketZipCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="doryCost">Dory Cost</Label>
              <Input
                id="doryCost"
                type="number"
                step="0.01"
                value={formData.doryCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    doryCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="fullZipCost">Full Zip Cost</Label>
              <Input
                id="fullZipCost"
                type="number"
                step="0.01"
                value={formData.fullZipCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullZipCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="elasticCost">Elastic Cost</Label>
              <Input
                id="elasticCost"
                type="number"
                step="0.01"
                value={formData.elasticCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    elasticCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="packingZipperCost">Packing Zipper Cost</Label>
              <Input
                id="packingZipperCost"
                type="number"
                step="0.01"
                value={formData.packingZipperCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packingZipperCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="packingShopperCost">Packing Shopper Cost</Label>
              <Input
                id="packingShopperCost"
                type="number"
                step="0.01"
                value={formData.packingShopperCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packingShopperCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="threadCost">Thread Cost</Label>
              <Input
                id="threadCost"
                type="number"
                step="0.01"
                value={formData.threadCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    threadCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Production'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
