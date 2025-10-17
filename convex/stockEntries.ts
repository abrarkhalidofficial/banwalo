import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    const stockEntries = await ctx.db.query('stockEntries').collect();

    const stockWithMaterials = await Promise.all(
      stockEntries.map(async (entry) => {
        const material = await ctx.db.get(entry.materialId);
        const supplier = await ctx.db.get(entry.supplierId);
        return {
          ...entry,
          materialName: material?.name || 'Unknown Material',
          supplierName: supplier?.name || 'Unknown Supplier',
          material,
        };
      }),
    );

    return stockWithMaterials;
  },
});

export const getById = query({
  args: { id: v.id('stockEntries') },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return null;

    const material = await ctx.db.get(entry.materialId);
    const supplier = await ctx.db.get(entry.supplierId);

    return {
      ...entry,
      materialName: material?.name || 'Unknown Material',
      supplierName: supplier?.name || 'Unknown Supplier',
      material,
    };
  },
});

export const getBySupplier = query({
  args: { supplierId: v.id('suppliers') },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('stockEntries')
      .withIndex('by_supplier', (q) => q.eq('supplierId', args.supplierId))
      .collect();

    const entriesWithMaterials = await Promise.all(
      entries.map(async (entry) => {
        const material = await ctx.db.get(entry.materialId);
        return {
          ...entry,
          materialName: material?.name || 'Unknown Material',
        };
      }),
    );

    return entriesWithMaterials;
  },
});

export const getByMaterial = query({
  args: { materialId: v.id('materials') },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('stockEntries')
      .withIndex('by_material', (q) => q.eq('materialId', args.materialId))
      .collect();

    const entriesWithSuppliers = await Promise.all(
      entries.map(async (entry) => {
        const supplier = await ctx.db.get(entry.supplierId);
        return {
          ...entry,
          supplierName: supplier?.name || 'Unknown Supplier',
        };
      }),
    );

    return entriesWithSuppliers;
  },
});

export const getLowStockEntries = query({
  handler: async (ctx) => {
    const stockEntries = await ctx.db
      .query('stockEntries')
      .filter((q) => q.gt(q.field('remainingQuantity'), 0))
      .collect();

    const materialsMap = new Map();

    const materials = await ctx.db.query('materials').collect();
    materials.forEach((material) => {
      if (material.lowStockThreshold !== undefined) {
        materialsMap.set(material._id, material);
      }
    });

    const lowStockEntries = [];

    for (const entry of stockEntries) {
      const material = materialsMap.get(entry.materialId);
      if (material && material.lowStockThreshold && entry.remainingQuantity <= material.lowStockThreshold) {
        const supplier = await ctx.db.get(entry.supplierId);

        lowStockEntries.push({
          ...entry,
          materialName: material.name,
          supplierName: supplier?.name || 'Unknown Supplier',
          material,
        });
      }
    }

    return lowStockEntries;
  },
});

export const getConsumptionHistory = query({
  args: { stockEntryId: v.id('stockEntries') },
  handler: async (ctx, args) => {
    try {
      const consumptionRecords = await ctx.db
        .query('stockConsumption')
        .withIndex('by_stock_entry', (q) => q.eq('stockEntryId', args.stockEntryId))
        .collect();

      const enrichedRecords = [];

      for (const record of consumptionRecords) {
        let productionName = 'Production';

        if (record.productionId) {
          try {
            const production = await ctx.db.get(record.productionId);
            if (production) {
              productionName = production.articleName || 'Production';
            }
          } catch (err) {
            console.error('Error fetching production:', err);
          }
        }

        enrichedRecords.push({
          ...record,
          productionName,
          dateUsed: record.dateConsumed,
          cost: (record.quantityUsed || 0) * (record.pricePerUnit || 0),
        });
      }

      return enrichedRecords.sort((a, b) => {
        const dateA = a.dateConsumed || 0;
        const dateB = b.dateConsumed || 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error in getConsumptionHistory:', error);
      return [];
    }
  },
});

export const update = mutation({
  args: {
    id: v.id('stockEntries'),
    materialId: v.optional(v.id('materials')),
    supplierId: v.optional(v.id('suppliers')),
    quantity: v.optional(v.number()),
    pricePerUnit: v.optional(v.number()),
    dateReceived: v.optional(v.number()),
    notes: v.optional(v.string()),
    remainingQuantity: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { id, ...updatedFields } = args;

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingStockEntry = await ctx.db.get(id);

    if (!existingStockEntry) {
      throw new Error('Stock entry not found');
    }

    const beforeValue = existingStockEntry;

    await ctx.db.patch(id, updatedFields);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'update',
      entityAffected: 'stockEntries',
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return afterValue;
  },
});

export const create = mutation({
  args: {
    materialId: v.id('materials'),
    supplierId: v.id('suppliers'),
    quantity: v.number(),
    pricePerUnit: v.number(),
    dateReceived: v.number(),
    notes: v.optional(v.string()),
    remainingQuantity: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (args.pricePerUnit <= 0) {
      throw new Error('Price per unit must be greater than zero');
    }

    const stockEntryId = await ctx.db.insert('stockEntries', {
      materialId: args.materialId,
      supplierId: args.supplierId,
      quantity: args.quantity,
      pricePerUnit: args.pricePerUnit,
      dateReceived: args.dateReceived,
      remainingQuantity: args.remainingQuantity ?? args.quantity,
    });

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const afterValue = await ctx.db.get(stockEntryId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'stockEntries',
      entityId: String(stockEntryId),
      afterValue: afterValue,
    });

    return stockEntryId;
  },
});

export const consumeStock = mutation({
  args: {
    stockEntryId: v.id('stockEntries'),
    quantityUsed: v.number(),
    productionId: v.optional(v.id('productions')),
    notes: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const stockEntry = await ctx.db.get(args.stockEntryId);
    if (!stockEntry) {
      throw new Error('Stock entry not found');
    }

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    if (stockEntry.remainingQuantity < args.quantityUsed) {
      throw new Error('Not enough stock remaining');
    }

    const beforeValue = stockEntry;

    await ctx.db.patch(args.stockEntryId, {
      remainingQuantity: stockEntry.remainingQuantity - args.quantityUsed,
    });

    const afterValue = await ctx.db.get(args.stockEntryId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'consume',
      entityAffected: 'stockEntries',
      entityId: String(args.stockEntryId),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    const consumptionId = await ctx.db.insert('stockConsumption', {
      stockEntryId: args.stockEntryId,
      productionId: args.productionId,
      quantityUsed: args.quantityUsed,
      pricePerUnit: stockEntry.pricePerUnit,
      dateConsumed: Date.now(),
      notes: args.notes,
    });

    return consumptionId;
  },
});

export const remove = mutation({
  args: {
    id: v.id('stockEntries'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingStockEntry = await ctx.db.get(args.id);

    if (!existingStockEntry) {
      throw new Error('Stock entry not found');
    }

    const beforeValue = existingStockEntry;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'stockEntries',
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return { success: true };
  },
});
