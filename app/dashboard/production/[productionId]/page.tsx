'use client';

import { ArrowLeft, Calendar, ChevronDown, ChevronRight, DollarSign, Edit2, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import useAuth from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { useQuery } from 'convex/react';

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

export default function ProductionDetailPage() {
  const params = useParams();

  const router = useRouter();

  const { id: userId } = useAuth();

  const updateProduction = useMutation(api.productionOrders.update);

  const productionId = params.productionId as Id<'productionOrders'>;

  const production = useQuery(api.productionOrders.getById, { id: productionId });
  const expenseAllocation = useQuery(api.productionOrders.getExpenseAllocation, { id: productionId });

  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [newStatus, setNewStatus] = useState<string>('');

  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set(['all']));

  const toggleMaterialExpanded = (materialName: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(materialName)) {
      newExpanded.delete(materialName);
    } else {
      newExpanded.add(materialName);
    }
    setExpandedMaterials(newExpanded);
  };

  const materialGrouped = useMemo(() => {
    if (!production?.materialConsumptions) return {};
    const grouped: Record<string, typeof production.materialConsumptions> = {};
    production.materialConsumptions.forEach((consumption) => {
      if (!grouped[consumption.materialName]) {
        grouped[consumption.materialName] = [];
      }
      grouped[consumption.materialName].push(consumption);
    });
    return grouped;
  }, [production]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !userId) return;

    try {
      await updateProduction({
        id: productionId,
        status: newStatus,
        userId,
      });
      setIsEditingStatus(false);
      toast.success('Status updated successfully!');
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  if (!production) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/production')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const calculateLaborCost = () => {
    const costsPerUnit =
      (production.cuttingCost || 0) +
      (production.overlockedShirtCost || 0) +
      (production.overlockedTrouserCost || 0) +
      (production.flatShirtCost || 0) +
      (production.flatTrouserCost || 0) +
      (production.singleShirtCost || 0) +
      (production.singleTrouserCost || 0) +
      (production.threadingCost || 0);
    return costsPerUnit * production.totalPieces;
  };

  const calculateOptionalCosts = () => {
    return (
      (production.printingCost || 0) +
      (production.pocketZipCost || 0) +
      (production.doryCost || 0) +
      (production.fullZipCost || 0) +
      (production.elasticCost || 0) +
      (production.packingZipperCost || 0) +
      (production.packingShopperCost || 0) +
      (production.threadCost || 0)
    );
  };

  const materialCost = production.materialConsumptions.reduce((sum, consumption) => sum + consumption.totalCost, 0);
  const laborCost = calculateLaborCost();
  const optionalCosts = calculateOptionalCosts();
  const allocatedExpense = expenseAllocation?.allocatedExpense || 0;
  const totalCost = materialCost + laborCost + optionalCosts + allocatedExpense;
  const revenue = (production.clientPrice || 0) * production.totalPieces;
  const profit = revenue - totalCost;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard/production')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{production.articleName}</h1>
            <p className="text-gray-500">{production.clientName}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/production/${productionId}/edit`)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isEditingStatus ? (
              <div className="space-y-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleStatusUpdate}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingStatus(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{production.status}</span>
                <button onClick={() => setIsEditingStatus(true)} className="text-blue-600 hover:underline text-sm">
                  Change
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Pieces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{production.totalPieces}</p>
            {production.solidPieces && <p className="text-sm text-gray-500">{production.solidPieces} solid pieces</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{production.type}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{formatDate(production.createdAt)}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-semibold">{production.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Article Name</p>
              <p className="font-semibold">{production.articleName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold">{production.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Pieces</p>
                <p className="font-semibold">{production.totalPieces}</p>
              </div>
              {production.solidPieces && (
                <div>
                  <p className="text-sm text-gray-500">Solid Pieces</p>
                  <p className="font-semibold">{production.solidPieces}</p>
                </div>
              )}
            </div>
            {production.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-semibold">{production.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Created Date</p>
              <p className="font-semibold">{formatDate(production.createdAt)}</p>
            </div>
            {production.cuttingDate && (
              <div>
                <p className="text-sm text-gray-500">Cutting Date</p>
                <p className="font-semibold">{formatDate(production.cuttingDate)}</p>
              </div>
            )}
            {production.stitchingDate && (
              <div>
                <p className="text-sm text-gray-500">Stitching Date</p>
                <p className="font-semibold">{formatDate(production.stitchingDate)}</p>
              </div>
            )}
            {production.updatedAt && (
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-semibold">{formatDate(production.updatedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span>Material Cost</span>
              <span className="font-semibold">{formatCurrency(materialCost)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span>Labor Cost</span>
              <span className="font-semibold">{formatCurrency(laborCost)}</span>
            </div>
            {optionalCosts > 0 && (
              <div className="flex justify-between items-center pb-3 border-b">
                <span>Additional Costs</span>
                <span className="font-semibold">{formatCurrency(optionalCosts)}</span>
              </div>
            )}
            {allocatedExpense > 0 && (
              <div className="flex justify-between items-center pb-3 border-b bg-blue-50 px-3 rounded">
                <div className="flex flex-col">
                  <span>Allocated Expenses</span>
                  <span className="text-xs text-gray-500">
                    {expenseAllocation?.totalExpensesThisMonth ? `₹${expenseAllocation.totalExpensesThisMonth.toFixed(2)} ÷ ${expenseAllocation.productionCountThisMonth} productions` : ''}
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(allocatedExpense)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-gray-50 px-3 rounded font-bold">
              <span>Total Cost</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
            <p className="text-sm text-gray-500">
              ₹{production.clientPrice}/unit × {production.totalPieces} pieces
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
            <p className="text-sm text-gray-500">Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Overhead Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(allocatedExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
            <p className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{((profit / revenue) * 100).toFixed(1)}% margin</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Labor Costs (Per Unit)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {production.cuttingCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Cutting</p>
                <p className="font-semibold">{formatCurrency(production.cuttingCost)}</p>
              </div>
            )}
            {production.overlockedShirtCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Overlocked Shirt</p>
                <p className="font-semibold">{formatCurrency(production.overlockedShirtCost)}</p>
              </div>
            )}
            {production.overlockedTrouserCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Overlocked Trouser</p>
                <p className="font-semibold">{formatCurrency(production.overlockedTrouserCost)}</p>
              </div>
            )}
            {production.flatShirtCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Flat Shirt</p>
                <p className="font-semibold">{formatCurrency(production.flatShirtCost)}</p>
              </div>
            )}
            {production.flatTrouserCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Flat Trouser</p>
                <p className="font-semibold">{formatCurrency(production.flatTrouserCost)}</p>
              </div>
            )}
            {production.singleShirtCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Single Shirt</p>
                <p className="font-semibold">{formatCurrency(production.singleShirtCost)}</p>
              </div>
            )}
            {production.singleTrouserCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Single Trouser</p>
                <p className="font-semibold">{formatCurrency(production.singleTrouserCost)}</p>
              </div>
            )}
            {production.threadingCost > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Threading</p>
                <p className="font-semibold">{formatCurrency(production.threadingCost)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {expenseAllocation && expenseAllocation.expenseBreakdown.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expense Allocation for {expenseAllocation.month}</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Total Monthly Expenses: {formatCurrency(expenseAllocation.totalExpensesThisMonth)} ÷ {expenseAllocation.productionCountThisMonth} productions ={' '}
              {formatCurrency(expenseAllocation.allocatedExpense)}/production
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expenseAllocation.expenseBreakdown.map((expense, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{expense.category}</p>
                      <p className="text-xs text-gray-500">{expense.date}</p>
                      {expense.note && <p className="text-xs text-gray-600 mt-1 italic">{expense.note}</p>}
                    </div>
                    <p className="font-semibold text-blue-600">{formatCurrency(expense.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Material Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-8 min-w-8"></TableHead>
                  <TableHead className="flex-1">Material</TableHead>
                  <TableHead className="text-right w-32 min-w-32">Total Quantity</TableHead>
                  <TableHead className="text-right w-32 min-w-32">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {production.materialConsumptions.length > 0 ? (
                  Object.entries(materialGrouped).map(([materialName, consumptions]) => {
                    const isExpanded = expandedMaterials.has(materialName);
                    const totalQuantity = consumptions.reduce((sum: number, c) => sum + c.quantityConsumed, 0);
                    const totalMaterialCost = consumptions.reduce((sum: number, c) => sum + c.totalCost, 0);

                    return (
                      <tbody key={materialName}>
                        <TableRow className="bg-blue-50 hover:bg-blue-100 cursor-pointer" onClick={() => toggleMaterialExpanded(materialName)}>
                          <TableCell className="w-8 min-w-8 text-center">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
                          </TableCell>
                          <TableCell className="font-bold text-blue-900">{materialName}</TableCell>
                          <TableCell className="text-right w-32 min-w-32 font-semibold text-blue-900">{totalQuantity} units</TableCell>
                          <TableCell className="text-right w-32 min-w-32 font-bold text-blue-900">{formatCurrency(totalMaterialCost)}</TableCell>
                        </TableRow>
                        {isExpanded &&
                          consumptions.map((consumption: (typeof production.materialConsumptions)[number], idx: number) => (
                            <TableRow key={`${materialName}-${idx}`} className="bg-gray-50 hover:bg-gray-100">
                              <TableCell className="w-8 min-w-8"></TableCell>
                              <TableCell className="pl-8">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <span className="text-sm text-gray-700">Stock Entry {idx + 1}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right w-32 min-w-32">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-semibold">{consumption.quantityConsumed}</span>
                                  <span className="text-xs text-gray-500">@ {formatCurrency(consumption.pricePerUnit)}/unit</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right w-32 min-w-32">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold">{formatCurrency(consumption.totalCost)}</span>
                                  <span className="text-xs text-gray-500">{formatDate(consumption.stockEntryDate)}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </tbody>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No materials consumed yet
                    </TableCell>
                  </TableRow>
                )}
                {production.materialConsumptions.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell className="w-8 min-w-8"></TableCell>
                    <TableCell className="text-left">Total Material Cost:</TableCell>
                    <TableCell className="text-right w-32 min-w-32">{production.materialConsumptions.reduce((sum, c) => sum + c.quantityConsumed, 0)} units</TableCell>
                    <TableCell className="text-right w-32 min-w-32">{formatCurrency(production.materialConsumptions.reduce((sum, c) => sum + c.totalCost, 0))}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
