import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getTotalExpensesForMonth } from "./ledger";
import { api } from "./_generated/api";
interface Production {
  _id: Id<"productions">;
  clientId: Id<"clients">;
  articleName: string;
  type: string;
  totalPieces: number;
  solidPieces?: number;
  cuttingDate?: number;
  stitchingDate?: number;
  status: string;
  notes?: string;
  clientPrice: number;
  
  // Labor costs (required)
  cuttingCost: number;
  overlockedShirtCost: number;
  overlockedTrouserCost: number;
  flatShirtCost: number;
  flatTrouserCost: number;
  singleShirtCost: number;
  singleTrouserCost: number;
  threadingCost: number;
  
  // Optional costs
  printingCost?: number;
  pocketZipCost?: number;
  doryCost?: number;
  fullZipCost?: number;
  elasticCost?: number;
  packingZipperCost?: number;
  packingShopperCost?: number;
  threadCost?: number;
  
  createdAt: number;
}

interface Client {
  _id: Id<"clients">;
  name: string;
}

interface ProductionMaterial {
  _id: Id<"productionMaterials">;
  productionId: Id<"productions">;
  materialId: Id<"materials">;
  quantity: number;
}

interface Material {
  _id: Id<"materials">;
  name: string;
  type: string;
}

// List all productions with client names
export const list = query({
  handler: async (ctx) => {
    const productions = await ctx.db.query("productions").collect();
    
    // Get client names for each production
    const productionsWithClientNames = await Promise.all(
      productions.map(async (production) => {
        const client = await ctx.db.get(production.clientId);
        return {
          ...production,
          clientName: client ? client.name : "Unknown Client"
        };
      })
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
      .query("productions")
      .filter((q) =>
        q.and(
          q.gte(q.field("cuttingDate"), startOfMonth),
          q.lt(q.field("cuttingDate"), endOfMonth)
        )
      )
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
      .query("productions")
      .filter((q) =>
        q.and(
          q.gte(q.field("cuttingDate"), startOfMonth),
          q.lt(q.field("cuttingDate"), endOfMonth)
        )
      )
      .collect();

    const totalPiecesProduced = productionsInMonth.reduce(
      (sum, production) => sum + production.totalPieces,
      0
    );

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
      console.warn("No pieces produced for the month. Skipping overhead calculation.");
      return;
    }

    const overheadCostPerPiece = totalExpensesForMonth / totalPiecesProduced;

    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0).getTime();

    const productionsInMonth = await ctx.db
      .query("productions")
      .filter((q) =>
        q.and(
          q.gte(q.field("cuttingDate"), startOfMonth),
          q.lt(q.field("cuttingDate"), endOfMonth)
        )
      )
      .collect();

    for (const production of productionsInMonth) {
      const productionCost = (
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
        (production.threadCost || 0)
      );

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
    id: v.id("productions"),
    clientId: v.optional(v.id("clients")),
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
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingProduction = await ctx.db.get(id);

    if (!existingProduction) {
      throw new Error("Production not found");
    }

    const beforeValue = existingProduction;

    await ctx.db.patch(id, fields);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "update",
      entityAffected: "productions",
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return afterValue;
  },
});

export const get = query({
  args: { id: v.id("productions") },
  handler: async (ctx, args) => {
    const production = await ctx.db.get(args.id);
    
    if (!production) {
      return null;
    }
    
    // Get client information
    const client = await ctx.db.get(production.clientId);
    
    // Get materials for this production
    const materials = await ctx.db
      .query("productionMaterials")
      .withIndex("by_production", (q) => q.eq("productionId", args.id))
      .take(100); // Use take instead of collect to avoid potential limits
    
    // Get material details for each material
    const materialsWithDetails = await Promise.all(
      materials.map(async (pm) => {
        const material = await ctx.db.get(pm.materialId);
        return {
          ...pm,
          materialName: material?.name || "Unknown Material",
          materialType: material?.type || "Unknown Type",
        };
      })
    );

    return {
      ...production,
      clientName: client ? client.name : "Unknown Client",
      materials: materialsWithDetails,
    };
  },
});

export const remove = mutation({
  args: {
    id: v.id("productions"),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingProduction = await ctx.db.get(args.id);

    if (!existingProduction) {
      throw new Error("Production not found");
    }

    const beforeValue = existingProduction;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "delete",
      entityAffected: "productions",
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return { success: true };
  },
});