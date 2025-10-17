import { mutation, query } from './_generated/server';

import { Id } from './_generated/dataModel';
import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query('productionOrders').collect();

    const clientsById = new Map();
    for (const order of orders) {
      if (!clientsById.has(order.clientId.toString())) {
        const client = await ctx.db.get(order.clientId);
        clientsById.set(order.clientId.toString(), client);
      }
    }

    return orders.map((order) => {
      const client = clientsById.get(order.clientId.toString());
      return {
        ...order,
        clientName: client?.name || 'Unknown Client',
      };
    });
  },
});

export const getById = query({
  args: { id: v.id('productionOrders') },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    const client = await ctx.db.get(order.clientId);

    const consumptions = await ctx.db
      .query('materialConsumptions')
      .withIndex('by_production_order', (q) => q.eq('productionOrderId', args.id))
      .collect();

    const enrichedConsumptions = [];
    for (const consumption of consumptions) {
      const material = await ctx.db.get(consumption.materialId);
      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      enrichedConsumptions.push({
        ...consumption,
        materialName: material?.name || 'Unknown Material',
        stockEntryDate: stockEntry?.dateReceived,
      });
    }

    return {
      ...order,
      clientName: client?.name || 'Unknown Client',
      materialConsumptions: enrichedConsumptions,
    };
  },
});

export const getExpenseAllocation = query({
  args: { id: v.id('productionOrders') },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    // Get the month and year of the production order
    const orderDate = new Date(order.createdAt);
    const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
    const monthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all expenses for this month
    const monthlyExpenses = await ctx.db.query('expenses').collect();
    const expensesThisMonth = monthlyExpenses.filter((e) => e.date >= monthStart.getTime() && e.date <= monthEnd.getTime());

    const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

    // Get all production orders for this month
    const allOrders = await ctx.db.query('productionOrders').collect();
    const ordersThisMonth = allOrders.filter((o) => o.createdAt >= monthStart.getTime() && o.createdAt <= monthEnd.getTime());

    const productionCountThisMonth = ordersThisMonth.length;

    // Calculate allocated expenses for this production
    const allocatedExpense = productionCountThisMonth > 0 ? totalExpensesThisMonth / productionCountThisMonth : 0;

    return {
      allocatedExpense,
      totalExpensesThisMonth,
      productionCountThisMonth,
      month: orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      expenseBreakdown: expensesThisMonth.map((e) => ({
        date: new Date(e.date).toLocaleDateString('en-US'),
        amount: e.amount,
        category: e.category,
        note: e.note,
      })),
    };
  },
});

const calculateFIFOConsumption = async (
  ctx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  materialQuantities: Array<{ materialId: Id<'materials'>; quantityNeeded: number }>,
) => {
  const consumptionRecords: Array<{
    materialId: Id<'materials'>;
    stockEntryId: Id<'stockEntries'>;
    quantityConsumed: number;
    pricePerUnit: number;
    totalCost: number;
  }> = [];

  for (const { materialId, quantityNeeded } of materialQuantities) {
    let remainingQuantity = quantityNeeded;

    const stockEntries = await ctx.db
      .query('stockEntries')
      .withIndex('by_material', (q: any) => q.eq('materialId', materialId)) // eslint-disable-line @typescript-eslint/no-explicit-any
      .order('asc')
      .collect();

    for (const stockEntry of stockEntries) {
      if (remainingQuantity <= 0) break;

      const quantityToConsume = Math.min(remainingQuantity, stockEntry.remainingQuantity);

      if (quantityToConsume > 0) {
        consumptionRecords.push({
          materialId,
          stockEntryId: stockEntry._id,
          quantityConsumed: quantityToConsume,
          pricePerUnit: stockEntry.pricePerUnit,
          totalCost: quantityToConsume * stockEntry.pricePerUnit,
        });

        remainingQuantity -= quantityToConsume;
      }
    }

    if (remainingQuantity > 0) {
      throw new Error(`Not enough stock for material. Missing ${remainingQuantity} units of materialId: ${materialId}`);
    }
  }

  return consumptionRecords;
};

export const create = mutation({
  args: {
    clientId: v.id('clients'),
    articleName: v.string(),
    type: v.string(),
    totalPieces: v.number(),
    solidPieces: v.optional(v.number()),
    cuttingDate: v.optional(v.number()),
    stitchingDate: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    cuttingCost: v.number(),
    overlockedShirtCost: v.number(),
    overlockedTrouserCost: v.number(),
    flatShirtCost: v.number(),
    flatTrouserCost: v.number(),
    singleShirtCost: v.number(),
    singleTrouserCost: v.number(),
    threadingCost: v.number(),
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    clientPrice: v.optional(v.number()),
    materialConsumptions: v.array(
      v.object({
        materialId: v.id('materials'),
        quantityNeeded: v.number(),
      }),
    ),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const orderId = await ctx.db.insert('productionOrders', {
      clientId: args.clientId,
      articleName: args.articleName,
      type: args.type,
      totalPieces: args.totalPieces,
      solidPieces: args.solidPieces,
      cuttingDate: args.cuttingDate,
      stitchingDate: args.stitchingDate,
      status: args.status || 'Planning',
      notes: args.notes,
      cuttingCost: args.cuttingCost,
      overlockedShirtCost: args.overlockedShirtCost,
      overlockedTrouserCost: args.overlockedTrouserCost,
      flatShirtCost: args.flatShirtCost,
      flatTrouserCost: args.flatTrouserCost,
      singleShirtCost: args.singleShirtCost,
      singleTrouserCost: args.singleTrouserCost,
      threadingCost: args.threadingCost,
      printingCost: args.printingCost,
      pocketZipCost: args.pocketZipCost,
      doryCost: args.doryCost,
      fullZipCost: args.fullZipCost,
      elasticCost: args.elasticCost,
      packingZipperCost: args.packingZipperCost,
      packingShopperCost: args.packingShopperCost,
      threadCost: args.threadCost,
      clientPrice: args.clientPrice,
      createdAt: Date.now(),
    });

    const consumptionRecords = await calculateFIFOConsumption(ctx, args.materialConsumptions);

    for (const consumption of consumptionRecords) {
      await ctx.db.insert('materialConsumptions', {
        productionOrderId: orderId,
        materialId: consumption.materialId,
        stockEntryId: consumption.stockEntryId,
        quantityConsumed: consumption.quantityConsumed,
        pricePerUnit: consumption.pricePerUnit,
        totalCost: consumption.totalCost,
        consumedAt: Date.now(),
      });

      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      if (stockEntry) {
        await ctx.db.patch(consumption.stockEntryId, {
          remainingQuantity: stockEntry.remainingQuantity - consumption.quantityConsumed,
        });
      }
    }

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'productionOrders',
      entityId: String(orderId),
      afterValue: { orderId, materialConsumptions: consumptionRecords },
    });

    return {
      orderId,
      consumptionRecords,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id('productionOrders'),
    articleName: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    clientPrice: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error('Production order not found');
    }

    const beforeValue = order;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId, ...updateFields } = args;
    await ctx.db.patch(args.id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    const afterValue = await ctx.db.get(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'update',
      entityAffected: 'productionOrders',
      entityId: String(args.id),
      beforeValue,
      afterValue,
    });

    return afterValue;
  },
});

export const remove = mutation({
  args: {
    id: v.id('productionOrders'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error('Production order not found');
    }

    const consumptions = await ctx.db
      .query('materialConsumptions')
      .withIndex('by_production_order', (q) => q.eq('productionOrderId', args.id))
      .collect();

    for (const consumption of consumptions) {
      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      if (stockEntry) {
        await ctx.db.patch(consumption.stockEntryId, {
          remainingQuantity: stockEntry.remainingQuantity + consumption.quantityConsumed,
        });
      }

      await ctx.db.delete(consumption._id);
    }

    const beforeValue = order;
    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'productionOrders',
      entityId: String(args.id),
      beforeValue,
    });

    return { success: true };
  },
});

export const getMaterialConsumptionsByOrder = query({
  args: { productionOrderId: v.id('productionOrders') },
  handler: async (ctx, args) => {
    const consumptions = await ctx.db
      .query('materialConsumptions')
      .withIndex('by_production_order', (q) => q.eq('productionOrderId', args.productionOrderId))
      .collect();

    const enrichedConsumptions = [];
    for (const consumption of consumptions) {
      const material = await ctx.db.get(consumption.materialId);
      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      const supplier = stockEntry ? await ctx.db.get(stockEntry.supplierId) : null;

      enrichedConsumptions.push({
        ...consumption,
        materialName: material?.name || 'Unknown Material',
        materialType: material?.type || 'Unknown Type',
        stockEntryDate: stockEntry?.dateReceived,
        supplierName: supplier?.name || 'Unknown Supplier',
      });
    }

    return enrichedConsumptions;
  },
});

export const getMaterialConsumptionsByMaterial = query({
  args: { materialId: v.id('materials') },
  handler: async (ctx, args) => {
    const consumptions = await ctx.db
      .query('materialConsumptions')
      .withIndex('by_material', (q) => q.eq('materialId', args.materialId))
      .collect();

    const enrichedConsumptions = [];
    const ordersById = new Map();

    for (const consumption of consumptions) {
      if (!ordersById.has(consumption.productionOrderId.toString())) {
        const order = await ctx.db.get(consumption.productionOrderId);
        if (order) {
          const client = await ctx.db.get(order.clientId);
          ordersById.set(consumption.productionOrderId.toString(), {
            order,
            clientName: client?.name || 'Unknown Client',
          });
        }
      }

      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      const orderData = ordersById.get(consumption.productionOrderId.toString());

      enrichedConsumptions.push({
        ...consumption,
        productionOrderArticle: orderData?.order?.articleName || 'Unknown',
        clientName: orderData?.clientName,
        stockEntryDate: stockEntry?.dateReceived,
        quantity: consumption.quantityConsumed,
      });
    }

    return enrichedConsumptions.sort((a, b) => b.consumedAt - a.consumedAt);
  },
});

export const getMaterialConsumptionByStockEntry = query({
  args: { stockEntryId: v.id('stockEntries') },
  handler: async (ctx, args) => {
    const consumptions = await ctx.db
      .query('materialConsumptions')
      .withIndex('by_stock_entry', (q) => q.eq('stockEntryId', args.stockEntryId))
      .collect();

    const enrichedConsumptions = [];

    for (const consumption of consumptions) {
      const order = await ctx.db.get(consumption.productionOrderId);
      const material = await ctx.db.get(consumption.materialId);
      const client = order ? await ctx.db.get(order.clientId) : null;

      enrichedConsumptions.push({
        ...consumption,
        productionOrderArticle: order?.articleName || 'Unknown',
        clientName: client?.name || 'Unknown Client',
        materialName: material?.name || 'Unknown Material',
      });
    }

    return enrichedConsumptions;
  },
});

export const returnMaterials = mutation({
  args: {
    productionOrderId: v.id('productionOrders'),
    returnItems: v.array(
      v.object({
        consumptionId: v.id('materialConsumptions'),
        quantityToReturn: v.number(),
      }),
    ),
    notes: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const order = await ctx.db.get(args.productionOrderId);
    if (!order) {
      throw new Error('Production order not found');
    }

    const returnRecords = [];

    for (const returnItem of args.returnItems) {
      const consumption = await ctx.db.get(returnItem.consumptionId);
      if (!consumption) {
        throw new Error(`Consumption record not found: ${returnItem.consumptionId}`);
      }

      if (returnItem.quantityToReturn > consumption.quantityConsumed) {
        throw new Error(`Cannot return ${returnItem.quantityToReturn} - only ${consumption.quantityConsumed} was consumed`);
      }

      const newQuantityConsumed = consumption.quantityConsumed - returnItem.quantityToReturn;
      const newTotalCost = newQuantityConsumed * consumption.pricePerUnit;

      await ctx.db.patch(returnItem.consumptionId, {
        quantityConsumed: newQuantityConsumed,
        totalCost: newTotalCost,
      });

      const stockEntry = await ctx.db.get(consumption.stockEntryId);
      if (stockEntry) {
        await ctx.db.patch(consumption.stockEntryId, {
          remainingQuantity: stockEntry.remainingQuantity + returnItem.quantityToReturn,
        });
      }

      returnRecords.push({
        consumptionId: returnItem.consumptionId,
        quantityReturned: returnItem.quantityToReturn,
        stockEntryRestored: returnItem.quantityToReturn,
      });
    }

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'return',
      entityAffected: 'materialConsumptions',
      entityId: String(args.productionOrderId),
      afterValue: returnRecords,
      beforeValue: { returnItems: args.returnItems, notes: args.notes },
    });

    return {
      success: true,
      returned: returnRecords,
    };
  },
});

export const bulkUpdate = mutation({
  args: {
    userId: v.id('users'),
    updates: v.array(
      v.object({
        _id: v.id('productionOrders'),
        status: v.optional(v.string()),
        solidPieces: v.optional(v.number()),
        cuttingDate: v.optional(v.number()),
        stitchingDate: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    for (const update of args.updates) {
      const { _id, ...changes } = update;
      const existing = await ctx.db.get(_id);
      if (existing) {
        await ctx.db.patch(_id, changes);
        await ctx.runMutation(api.audit.createAuditLog, {
          userId: args.userId,
          actionType: 'update',
          entityAffected: 'productionOrders',
          entityId: String(_id),
          beforeValue: existing,
          afterValue: { ...existing, ...changes },
        });
      }
    }

    return { success: true };
  },
});
