import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    const stockEntries = await ctx.db.query('stockEntries').collect();

    const materialsById = new Map();
    const suppliersById = new Map();

    for (const entry of stockEntries) {
      if (!materialsById.has(entry.materialId.toString())) {
        const material = await ctx.db.get(entry.materialId);
        materialsById.set(entry.materialId.toString(), material);
      }
      if (!suppliersById.has(entry.supplierId.toString())) {
        const supplier = await ctx.db.get(entry.supplierId);
        suppliersById.set(entry.supplierId.toString(), supplier);
      }
    }

    return stockEntries.map((entry) => {
      const material = materialsById.get(entry.materialId.toString());
      const supplier = suppliersById.get(entry.supplierId.toString());
      return {
        ...entry,
        materialName: material?.name || 'Unknown Material',
        supplierName: supplier?.name || 'Unknown Supplier',
        material,
      };
    });
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

    const materialsById = new Map();
    for (const entry of entries) {
      if (!materialsById.has(entry.materialId.toString())) {
        const material = await ctx.db.get(entry.materialId);
        materialsById.set(entry.materialId.toString(), material);
      }
    }

    return entries.map((entry) => {
      const material = materialsById.get(entry.materialId.toString());
      return {
        ...entry,
        materialName: material?.name || 'Unknown Material',
      };
    });
  },
});

export const getByMaterial = query({
  args: { materialId: v.id('materials') },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('stockEntries')
      .withIndex('by_material', (q) => q.eq('materialId', args.materialId))
      .collect();

    const suppliersById = new Map();
    for (const entry of entries) {
      if (!suppliersById.has(entry.supplierId.toString())) {
        const supplier = await ctx.db.get(entry.supplierId);
        suppliersById.set(entry.supplierId.toString(), supplier);
      }
    }

    return entries.map((entry) => {
      const supplier = suppliersById.get(entry.supplierId.toString());
      return {
        ...entry,
        supplierName: supplier?.name || 'Unknown Supplier',
      };
    });
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

    const suppliersById = new Map();
    const lowStockEntries = [];

    for (const entry of stockEntries) {
      const material = materialsMap.get(entry.materialId);
      if (material && material.lowStockThreshold && entry.remainingQuantity <= material.lowStockThreshold) {
        if (!suppliersById.has(entry.supplierId.toString())) {
          const supplier = await ctx.db.get(entry.supplierId);
          suppliersById.set(entry.supplierId.toString(), supplier);
        }

        const supplier = suppliersById.get(entry.supplierId.toString());
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
        .query('materialConsumptions')
        .withIndex('by_stock_entry', (q) => q.eq('stockEntryId', args.stockEntryId))
        .collect();

      if (consumptionRecords.length === 0) {
        return [];
      }

      const enrichedRecords = [];
      const ordersById = new Map();

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

        const orderData = ordersById.get(record.productionOrderId.toString());

        enrichedRecords.push({
          ...record,
          productionOrderArticle: orderData?.order?.articleName || 'Unknown',
          clientName: orderData?.clientName,
          dateUsed: record.consumedAt,
          cost: record.totalCost,
          productionId: record.productionOrderId,
          productionName: orderData?.order?.articleName || 'Unknown',
          quantityUsed: record.quantityConsumed,
          dateConsumed: record.consumedAt,
        });
      }

      return enrichedRecords.sort((a, b) => b.consumedAt - a.consumedAt);
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
    productionId: v.id('productionOrders'),
    quantityUsed: v.number(),
    notes: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const stockEntry = await ctx.db.get(args.stockEntryId);
    if (!stockEntry) {
      throw new Error('Stock entry not found');
    }

    if (args.quantityUsed > stockEntry.remainingQuantity) {
      throw new Error('Not enough stock to consume');
    }

    const consumptionId = await ctx.db.insert('materialConsumptions', {
      productionOrderId: args.productionId,
      materialId: stockEntry.materialId,
      stockEntryId: args.stockEntryId,
      quantityConsumed: args.quantityUsed,
      pricePerUnit: stockEntry.pricePerUnit,
      totalCost: args.quantityUsed * stockEntry.pricePerUnit,
      consumedAt: Date.now(),
      notes: args.notes,
    });

    await ctx.db.patch(args.stockEntryId, {
      remainingQuantity: stockEntry.remainingQuantity - args.quantityUsed,
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
