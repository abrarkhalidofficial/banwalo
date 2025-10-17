import { mutation, query } from './_generated/server';

import { Id } from './_generated/dataModel';
import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('materials').collect();
  },
});

export const listWithLatestPrices = query({
  handler: async (ctx) => {
    const materials = await ctx.db.query('materials').collect();
    
    const materialsWithPrices = await Promise.all(
      materials.map(async (material) => {
        // Get all stock entries for this material, ordered by date received (most recent first)
        const stockEntries = await ctx.db
          .query('stockEntries')
          .withIndex('by_material', (q) => q.eq('materialId', material._id))
          .collect();
        
        // Find the latest stock entry (most recent dateReceived)
        let latestPrice = null;
        if (stockEntries.length > 0) {
          const latestEntry = stockEntries.reduce((latest, current) => 
            current.dateReceived > latest.dateReceived ? current : latest
          );
          latestPrice = latestEntry.pricePerUnit;
        }
        
        return {
          ...material,
          latestPrice,
        };
      })
    );
    
    return materialsWithPrices;
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
      const stockEntries = await ctx.db
        .query('stockEntries')
        .withIndex('by_material', (q) => q.eq('materialId', args.materialId))
        .collect();

      if (!stockEntries.length) return [];

      const stockEntryIds = stockEntries.map((entry) => entry._id);

      const consumptionRecords = [];
      for (const stockEntryId of stockEntryIds) {
        const records = await ctx.db
          .query('stockConsumption')
          .withIndex('by_stock_entry', (q) => q.eq('stockEntryId', stockEntryId))
          .collect();

        consumptionRecords.push(...records);
      }

      const productionMap = new Map();

      for (const record of consumptionRecords) {
        const prodId = record.productionId;
        if (!prodId) continue;

        if (!productionMap.has(prodId.toString())) {
          const production = await ctx.db.get(prodId);
          if (!production) continue;

          productionMap.set(prodId.toString(), {
            productionId: prodId,
            productionName: production.articleName || 'Unknown Production',
            dateUsed: record.dateConsumed || Date.now(),
            totalQuantity: 0,
            totalCost: 0,
          });
        }

        const entry = productionMap.get(prodId.toString());
        entry.totalQuantity += record.quantityUsed || 0;
        entry.totalCost += (record.quantityUsed || 0) * (record.pricePerUnit || 0);

        if (record.dateConsumed && record.dateConsumed < entry.dateUsed) {
          entry.dateUsed = record.dateConsumed;
        }
      }

      const usageHistory = Array.from(productionMap.values()).map((entry) => ({
        ...entry,
        quantity: entry.totalQuantity,
        averageCost: entry.totalQuantity > 0 ? entry.totalCost / entry.totalQuantity : 0,
      }));

      return usageHistory.sort((a, b) => b.dateUsed - a.dateUsed);
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
    unit: v.optional(v.string()),
    description: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const materialId = await ctx.db.insert('materials', {
      name: args.name,
      type: args.type,
      unit: args.unit,
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
    unit: v.optional(v.string()),
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
      unit: args.unit,
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
