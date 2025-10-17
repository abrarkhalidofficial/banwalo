import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    const productions = await ctx.db.query('productions').collect();

    const productionsWithClientNames = await Promise.all(
      productions.map(async (production) => {
        const client = await ctx.db.get(production.clientId);
        return {
          ...production,
          clientName: client ? client.name : 'Unknown Client',
        };
      }),
    );

    return productionsWithClientNames;
  },
});

export const getTotalPiecesProducedForMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0).getTime();

    const productions = await ctx.db
      .query('productions')
      .filter((q) => q.and(q.gte(q.field('cuttingDate'), startOfMonth), q.lt(q.field('cuttingDate'), endOfMonth)))
      .collect();

    return productions.reduce((sum, production) => sum + production.totalPieces, 0);
  },
});

export const getProductionsForMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0).getTime();

    const productionsInMonth = await ctx.db
      .query('productions')
      .filter((q) => q.and(q.gte(q.field('cuttingDate'), startOfMonth), q.lt(q.field('cuttingDate'), endOfMonth)))
      .collect();

    const totalPiecesProduced = productionsInMonth.reduce((sum, production) => sum + production.totalPieces, 0);

    return totalPiecesProduced;
  },
});

export const calculateAndApplyMonthlyOverhead = mutation({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    const totalExpensesForMonth = await ctx.runQuery(api.ledger.getTotalExpensesForMonth, { month, year });
    const totalPiecesProduced = await ctx.runQuery(api.productions.getTotalPiecesProducedForMonth, { month, year });

    if (totalPiecesProduced === 0) {
      console.warn('No pieces produced for the month. Skipping overhead calculation.');
      return;
    }

    const overheadCostPerPiece = totalExpensesForMonth / totalPiecesProduced;

    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0).getTime();

    const productionsInMonth = await ctx.db
      .query('productions')
      .filter((q) => q.and(q.gte(q.field('cuttingDate'), startOfMonth), q.lt(q.field('cuttingDate'), endOfMonth)))
      .collect();

    for (const production of productionsInMonth) {
      const productionCost =
        (production.cuttingCost || 0) +
        (production.overlockedShirtCost || 0) +
        (production.overlockedTrouserCost || 0) +
        (production.flatShirtCost || 0) +
        (production.flatTrouserCost || 0) +
        (production.singleShirtCost || 0) +
        (production.singleTrouserCost || 0) +
        (production.threadingCost || 0) +
        (production.printingCost || 0) +
        (production.pocketZipCost || 0) +
        (production.doryCost || 0) +
        (production.fullZipCost || 0) +
        (production.elasticCost || 0) +
        (production.packingZipperCost || 0) +
        (production.packingShopperCost || 0) +
        (production.threadCost || 0);

      const totalOverhead = overheadCostPerPiece * production.totalPieces;
      const finalTotalCost = productionCost + totalOverhead;
      const profit = ((production.clientPrice || 0) - finalTotalCost) * production.totalPieces;

      await ctx.db.patch(production._id, {
        overheadCostPerPiece,
        totalOverhead: totalOverhead,
        finalTotalCost,
        profit,
      });
    }
  },
});

export const updateProduction = mutation({
  args: {
    id: v.id('productions'),
    clientId: v.optional(v.id('clients')),
    articleName: v.optional(v.string()),
    type: v.optional(v.string()),
    totalPieces: v.optional(v.number()),
    solidPieces: v.optional(v.number()),
    cuttingDate: v.optional(v.number()),
    stitchingDate: v.optional(v.number()),
    status: v.optional(v.string()),
    cuttingCost: v.optional(v.number()),
    overlockedShirtCost: v.optional(v.number()),
    overlockedTrouserCost: v.optional(v.number()),
    flatShirtCost: v.optional(v.number()),
    flatTrouserCost: v.optional(v.number()),
    singleShirtCost: v.optional(v.number()),
    singleTrouserCost: v.optional(v.number()),
    threadingCost: v.optional(v.number()),
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    clientPrice: v.optional(v.number()),
    overheadCostPerPiece: v.optional(v.number()),
    totalOverheadCost: v.optional(v.number()),
    finalTotalCost: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingProduction = await ctx.db.get(id);

    if (!existingProduction) {
      throw new Error('Production not found');
    }

    const beforeValue = existingProduction;

    await ctx.db.patch(id, fields);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'update',
      entityAffected: 'productions',
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return afterValue;
  },
});

export const get = query({
  args: { id: v.id('productions') },
  handler: async (ctx, args) => {
    const production = await ctx.db.get(args.id);

    if (!production) {
      return null;
    }

    const client = await ctx.db.get(production.clientId);

    const materials = await ctx.db
      .query('productionMaterials')
      .withIndex('by_production', (q) => q.eq('productionId', args.id))
      .take(100);

    const materialsWithDetails = await Promise.all(
      materials.map(async (pm) => {
        const [material, latestStockEntry] = await Promise.all([
          ctx.db.get(pm.materialId),
          ctx.db
            .query('stockEntries')
            .withIndex('by_material', (q) => q.eq('materialId', pm.materialId))
            .order('desc')
            .first(),
        ]);

        return {
          ...pm,
          materialName: material?.name || 'Unknown Material',
          materialType: material?.type || 'Unknown Type',
          pricePerUnit: latestStockEntry?.pricePerUnit,
        };
      }),
    );

    return {
      ...production,
      clientName: client ? client.name : 'Unknown Client',
      materials: materialsWithDetails,
    };
  },
});

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
    cuttingCost: v.optional(v.number()),
    overlockedShirtCost: v.optional(v.number()),
    overlockedTrouserCost: v.optional(v.number()),
    flatShirtCost: v.optional(v.number()),
    flatTrouserCost: v.optional(v.number()),
    singleShirtCost: v.optional(v.number()),
    singleTrouserCost: v.optional(v.number()),
    threadingCost: v.optional(v.number()),
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    clientPrice: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const productionId = await ctx.db.insert('productions', {
      clientId: args.clientId,
      articleName: args.articleName,
      type: args.type,
      totalPieces: args.totalPieces,
      solidPieces: args.solidPieces ?? 0,
      cuttingDate: args.cuttingDate,
      stitchingDate: args.stitchingDate,
      status: args.status ?? 'Planning',
      cuttingCost: args.cuttingCost ?? 0,
      overlockedShirtCost: args.overlockedShirtCost ?? 0,
      overlockedTrouserCost: args.overlockedTrouserCost ?? 0,
      flatShirtCost: args.flatShirtCost ?? 0,
      flatTrouserCost: args.flatTrouserCost ?? 0,
      singleShirtCost: args.singleShirtCost ?? 0,
      singleTrouserCost: args.singleTrouserCost ?? 0,
      threadingCost: args.threadingCost ?? 0,
      printingCost: args.printingCost ?? 0,
      pocketZipCost: args.pocketZipCost ?? 0,
      doryCost: args.doryCost ?? 0,
      fullZipCost: args.fullZipCost ?? 0,
      elasticCost: args.elasticCost ?? 0,
      packingZipperCost: args.packingZipperCost ?? 0,
      packingShopperCost: args.packingShopperCost ?? 0,
      threadCost: args.threadCost ?? 0,
      clientPrice: args.clientPrice ?? 0,
      userId: args.userId,
    });

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'productions',
      entityId: String(productionId),
      afterValue: await ctx.db.get(productionId),
    });

    return productionId;
  },
});

export const bulkUpdate = mutation({
  args: {
    updates: v.array(
      v.object({
        _id: v.id('productions'),
        patch: v.optional(v.record(v.string(), v.any())),
      }),
    ),
    userId: v.id('users'),
  },
  handler: async (ctx, { updates, ...args }) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    for (const u of updates) {
      const id = u._id;
      if (u.patch && Object.keys(u.patch).length > 0) {
        await ctx.db.patch(id, u.patch);
      }
    }

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    id: v.id('productions'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingProduction = await ctx.db.get(args.id);

    if (!existingProduction) {
      throw new Error('Production not found');
    }

    const beforeValue = existingProduction;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'productions',
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return { success: true };
  },
});
