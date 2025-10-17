import { mutation, query } from './_generated/server';

import { Id } from './_generated/dataModel';
import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('materials').collect();
  },
});

export const getById = query({
  args: { id: v.id('materials') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMaterialUsageHistory = query({
  args: { materialId: v.id('materials') },
  handler: async (ctx, args) => {
    try {
      const consumptionRecords = await ctx.db
        .query('materialConsumptions')
        .withIndex('by_material', (q) => q.eq('materialId', args.materialId))
        .collect();

      if (consumptionRecords.length === 0) {
        return [];
      }

      const enrichedRecords = [];
      const ordersById = new Map();
      const stockEntriesById = new Map();

      for (const record of consumptionRecords) {
        if (!ordersById.has(record.productionOrderId.toString())) {
          const order = await ctx.db.get(record.productionOrderId);
          if (order) {
            const client = await ctx.db.get(order.clientId);
            ordersById.set(record.productionOrderId.toString(), {
              order,
              clientName: client?.name || 'Unknown Client',
            });
          }
        }

        if (!stockEntriesById.has(record.stockEntryId.toString())) {
          const stockEntry = await ctx.db.get(record.stockEntryId);
          if (stockEntry) {
            const supplier = await ctx.db.get(stockEntry.supplierId);
            stockEntriesById.set(record.stockEntryId.toString(), {
              stockEntry,
              supplierName: supplier?.name || 'Unknown Supplier',
            });
          }
        }
      }

      for (const record of consumptionRecords) {
        const orderData = ordersById.get(record.productionOrderId.toString());
        const stockData = stockEntriesById.get(record.stockEntryId.toString());

        enrichedRecords.push({
          ...record,
          productionOrderArticle: orderData?.order?.articleName || 'Unknown',
          productionOrderType: orderData?.order?.type || 'Unknown',
          clientName: orderData?.clientName,
          totalPieces: orderData?.order?.totalPieces,
          status: orderData?.order?.status,
          supplierName: stockData?.supplierName,
          stockEntryDate: stockData?.stockEntry?.dateReceived,
          stockEntryPricePerUnit: stockData?.stockEntry?.pricePerUnit,
          quantity: record.quantityConsumed,
          totalCost: record.totalCost,
          dateUsed: record.consumedAt,
          productionId: record.productionOrderId,
          productionName: orderData?.order?.articleName || 'Unknown',
          averageCost: record.pricePerUnit,
        });
      }

      return enrichedRecords.sort((a, b) => b.consumedAt - a.consumedAt);
    } catch (error) {
      console.error('Error in getMaterialUsageHistory:', error);
      return [];
    }
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const materialId = await ctx.db.insert('materials', {
      name: args.name,
      type: args.type,
      description: args.description,
      lowStockThreshold: args.lowStockThreshold,
      createdAt: Date.now(),
    });

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await ctx.runMutation(api.audit.createAuditLog, {
        userId: identity.subject as Id<'users'>,
        actionType: 'create',
        entityAffected: 'materials',
        entityId: String(materialId),
        afterValue: args,
      });
    }

    return materialId;
  },
});

export const update = mutation({
  args: {
    id: v.id('materials'),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingMaterial = await ctx.db.get(args.id);
    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      type: args.type,
      description: args.description,
      lowStockThreshold: args.lowStockThreshold,
    });

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await ctx.runMutation(api.audit.createAuditLog, {
        userId: identity.subject as Id<'users'>,
        actionType: 'update',
        entityAffected: 'materials',
        entityId: String(args.id),
        beforeValue: existingMaterial,
        afterValue: args,
      });
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id('materials'),
  },
  handler: async (ctx, args) => {
    const existingMaterial = await ctx.db.get(args.id);
    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    await ctx.db.delete(args.id);

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await ctx.runMutation(api.audit.createAuditLog, {
        userId: identity.subject as Id<'users'>,
        actionType: 'delete',
        entityAffected: 'materials',
        entityId: String(args.id),
        beforeValue: existingMaterial,
      });
    }
  },
});
