'use client';

import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Id } from '@/convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewProductionPage() {
  const router = useRouter();
  const { id: userId } = useAuth();
  const createProduction = useMutation(api.productionOrders.create);

  const clients = useQuery(api.clients.list) || [];

  const materials = useQuery(api.materials.list) || [];

  const [client, setClient] = useState<string>('');

  const [articleName, setArticleName] = useState<string>('');

  const [type, setType] = useState<string>('');

  const [totalPieces, setTotalPieces] = useState<string>('');

  const [solidPieces, setSolidPieces] = useState<string>('');

  const [cuttingDate, setCuttingDate] = useState<Date | undefined>(undefined);

  const [stitchingDate, setStitchingDate] = useState<Date | undefined>(undefined);

  const [status, setStatus] = useState<string>('Planning');

  const [notes, setNotes] = useState<string>('');

  const [cuttingCost, setCuttingCost] = useState<string>('');

  const [overlockedShirtCost, setOverlockedShirtCost] = useState<string>('');

  const [overlockedTrouserCost, setOverlockedTrouserCost] = useState<string>('');

  const [flatShirtCost, setFlatShirtCost] = useState<string>('');

  const [flatTrouserCost, setFlatTrouserCost] = useState<string>('');

  const [singleShirtCost, setSingleShirtCost] = useState<string>('');

  const [singleTrouserCost, setSingleTrouserCost] = useState<string>('');

  const [threadingCost, setThreadingCost] = useState<string>('');

  const [productionMaterials, setProductionMaterials] = useState([{ materialId: '', quantity: '' }]);

  const [printingCost, setPrintingCost] = useState<string>('');

  const [pocketZipCost, setPocketZipCost] = useState<string>('');

  const [doryCost, setDoryCost] = useState<string>('');

  const [fullZipCost, setFullZipCost] = useState<string>('');

  const [elasticCost, setElasticCost] = useState<string>('');

  const [packingZipperCost, setPackingZipperCost] = useState<string>('');

  const [packingShopperCost, setPackingShopperCost] = useState<string>('');

  const [threadCost, setThreadCost] = useState<string>('');

  const [clientPrice, setClientPrice] = useState<string>('');

  const addMaterialRow = () => {
    setProductionMaterials([...productionMaterials, { materialId: '', quantity: '' }]);
  };

  const removeMaterialRow = (index: number) => {
    const updatedMaterials = [...productionMaterials];
    updatedMaterials.splice(index, 1);
    setProductionMaterials(updatedMaterials);
  };

  const updateMaterial = (index: number, field: 'materialId' | 'quantity', value: string) => {
    const updatedMaterials = [...productionMaterials];
    updatedMaterials[index][field] = value;
    setProductionMaterials(updatedMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client || !articleName || !type || !totalPieces || !clientPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validMaterials = productionMaterials.filter((m) => m.materialId && m.quantity && parseFloat(m.quantity) > 0);

    if (validMaterials.length === 0) {
      toast.error('Please add at least one material with quantity');
      return;
    }

    try {
      const productionData: Record<string, number | string | Date | undefined | { materialId: Id<'materials'>; quantityNeeded: number }[]> = {
        clientId: client as Id<'clients'>,
        articleName,
        type,
        totalPieces: parseInt(totalPieces),
        cuttingDate: cuttingDate?.getTime(),
        stitchingDate: stitchingDate?.getTime(),
        status,
        notes: notes || undefined,
        cuttingCost: parseFloat(cuttingCost) || 0,
        overlockedShirtCost: parseFloat(overlockedShirtCost) || 0,
        overlockedTrouserCost: parseFloat(overlockedTrouserCost) || 0,
        flatShirtCost: parseFloat(flatShirtCost) || 0,
        flatTrouserCost: parseFloat(flatTrouserCost) || 0,
        singleShirtCost: parseFloat(singleShirtCost) || 0,
        singleTrouserCost: parseFloat(singleTrouserCost) || 0,
        threadingCost: parseFloat(threadingCost) || 0,
        clientPrice: parseFloat(clientPrice),
        materialConsumptions: validMaterials.map((m) => ({
          materialId: m.materialId as Id<'materials'>,
          quantityNeeded: parseFloat(m.quantity),
        })),
        userId,
      };

      if (solidPieces && parseInt(solidPieces) > 0) {
        productionData.solidPieces = parseInt(solidPieces);
      }

      if (printingCost && parseFloat(printingCost) > 0) {
        productionData.printingCost = parseFloat(printingCost);
      }
      if (pocketZipCost && parseFloat(pocketZipCost) > 0) {
        productionData.pocketZipCost = parseFloat(pocketZipCost);
      }
      if (doryCost && parseFloat(doryCost) > 0) {
        productionData.doryCost = parseFloat(doryCost);
      }
      if (fullZipCost && parseFloat(fullZipCost) > 0) {
        productionData.fullZipCost = parseFloat(fullZipCost);
      }
      if (elasticCost && parseFloat(elasticCost) > 0) {
        productionData.elasticCost = parseFloat(elasticCost);
      }
      if (packingZipperCost && parseFloat(packingZipperCost) > 0) {
        productionData.packingZipperCost = parseFloat(packingZipperCost);
      }
      if (packingShopperCost && parseFloat(packingShopperCost) > 0) {
        productionData.packingShopperCost = parseFloat(packingShopperCost);
      }
      if (threadCost && parseFloat(threadCost) > 0) {
        productionData.threadCost = parseFloat(threadCost);
      }

      const result = await createProduction(productionData as Parameters<typeof createProduction>[0]);

      toast.success('Production created successfully!');
      router.push(`/dashboard/production/${result.orderId}`);
    } catch (error) {
      console.error('Error creating production:', error);
      toast.error('Failed to create production. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <Button variant="ghost" className="mr-4" onClick={() => router.push('/dashboard/production')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">New Production</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="labor">Labor Costs</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="optional">Optional Costs</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">
                      Client <span className="text-red-500">*</span>
                    </Label>
                    <Select value={client} onValueChange={setClient}>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Select client" />
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

                  <div className="space-y-2">
                    <Label htmlFor="articleName">
                      Article Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="articleName" value={articleName} onChange={(e) => setArticleName(e.target.value)} placeholder="Enter article name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tracksuit">Tracksuit</SelectItem>
                        <SelectItem value="Hoodie">Hoodie</SelectItem>
                        <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                        <SelectItem value="Pants">Pants</SelectItem>
                        <SelectItem value="Jacket">Jacket</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalPieces">
                      Total Number of Pieces <span className="text-red-500">*</span>
                    </Label>
                    <Input id="totalPieces" type="number" min="1" value={totalPieces} onChange={(e) => setTotalPieces(e.target.value)} placeholder="Enter total pieces" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="solidPieces">Number of Solid Pieces</Label>
                    <Input id="solidPieces" type="number" min="0" value={solidPieces} onChange={(e) => setSolidPieces(e.target.value)} placeholder="Enter solid pieces" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuttingDate">Cutting Date</Label>
                    <DatePicker selected={cuttingDate} onSelect={setCuttingDate} placeholder="Select cutting date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stitchingDate">Stitching Date</Label>
                    <DatePicker selected={stitchingDate} onSelect={setStitchingDate} placeholder="Select stitching date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter any additional notes" rows={4} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="labor">
            <Card>
              <CardHeader>
                <CardTitle>Labor Costs (per piece)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuttingCost">Cutting Cost</Label>
                    <Input id="cuttingCost" type="number" min="0" step="0.01" value={cuttingCost} onChange={(e) => setCuttingCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overlockedShirtCost">Overlocked Shirt Cost</Label>
                    <Input id="overlockedShirtCost" type="number" min="0" step="0.01" value={overlockedShirtCost} onChange={(e) => setOverlockedShirtCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overlockedTrouserCost">Overlocked Trouser Cost</Label>
                    <Input id="overlockedTrouserCost" type="number" min="0" step="0.01" value={overlockedTrouserCost} onChange={(e) => setOverlockedTrouserCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flatShirtCost">Flat Shirt Cost</Label>
                    <Input id="flatShirtCost" type="number" min="0" step="0.01" value={flatShirtCost} onChange={(e) => setFlatShirtCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flatTrouserCost">Flat Trouser Cost</Label>
                    <Input id="flatTrouserCost" type="number" min="0" step="0.01" value={flatTrouserCost} onChange={(e) => setFlatTrouserCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="singleShirtCost">Single Shirt Cost</Label>
                    <Input id="singleShirtCost" type="number" min="0" step="0.01" value={singleShirtCost} onChange={(e) => setSingleShirtCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="singleTrouserCost">Single Trouser Cost</Label>
                    <Input id="singleTrouserCost" type="number" min="0" step="0.01" value={singleTrouserCost} onChange={(e) => setSingleTrouserCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threadingCost">Threading Cost</Label>
                    <Input id="threadingCost" type="number" min="0" step="0.01" value={threadingCost} onChange={(e) => setThreadingCost(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionMaterials.map((material, index) => (
                    <div key={index} className="flex items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Material</Label>
                        <Select value={material.materialId} onValueChange={(value) => updateMaterial(index, 'materialId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m._id} value={m._id}>
                                {m.name} ({m.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-1/4 space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" min="0" step="0.01" value={material.quantity} onChange={(e) => updateMaterial(index, 'quantity', e.target.value)} placeholder="0.00" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterialRow(index)} disabled={productionMaterials.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addMaterialRow} className="mt-2">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="optional">
            <Card>
              <CardHeader>
                <CardTitle>Optional Costs (per piece)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="printingCost">Printing Cost</Label>
                    <Input id="printingCost" type="number" min="0" step="0.01" value={printingCost} onChange={(e) => setPrintingCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pocketZipCost">Pocket Zip Cost</Label>
                    <Input id="pocketZipCost" type="number" min="0" step="0.01" value={pocketZipCost} onChange={(e) => setPocketZipCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doryCost">Dory Cost</Label>
                    <Input id="doryCost" type="number" min="0" step="0.01" value={doryCost} onChange={(e) => setDoryCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullZipCost">Full Zip Cost</Label>
                    <Input id="fullZipCost" type="number" min="0" step="0.01" value={fullZipCost} onChange={(e) => setFullZipCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="elasticCost">Elastic Cost</Label>
                    <Input id="elasticCost" type="number" min="0" step="0.01" value={elasticCost} onChange={(e) => setElasticCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packingZipperCost">Packing Zipper Cost</Label>
                    <Input id="packingZipperCost" type="number" min="0" step="0.01" value={packingZipperCost} onChange={(e) => setPackingZipperCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packingShopperCost">Packing Shopper Cost</Label>
                    <Input id="packingShopperCost" type="number" min="0" step="0.01" value={packingShopperCost} onChange={(e) => setPackingShopperCost(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threadCost">Thread Cost</Label>
                    <Input id="threadCost" type="number" min="0" step="0.01" value={threadCost} onChange={(e) => setThreadCost(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="clientPrice">
                    Client Price (per piece) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="clientPrice" type="number" min="0" step="0.01" value={clientPrice} onChange={(e) => setClientPrice(e.target.value)} placeholder="0.00" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/production')}>
            Cancel
          </Button>
          <Button type="submit">Create Production</Button>
        </div>
      </form>
    </div>
  );
}
