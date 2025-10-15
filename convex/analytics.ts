import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export const getProfitThisMonth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const start = startOfMonth(now).getTime();
    const end = endOfMonth(now).getTime();

    const productions = await ctx.db
      .query("productions")
      .withIndex("by_creation_time", (q: any) => q.gt("createdAt", start).lt("createdAt", end))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_creation_time", (q: any) => q.gt("date", start).lt("date", end))
      .collect();

    const totalRevenue = productions.reduce((sum, p) => sum + (p.clientPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return totalRevenue - totalExpenses;
  },
});

export const getProfitThisWeek = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const start = startOfWeek(now, { weekStartsOn: 1 }).getTime(); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }).getTime(); // Sunday

    const productions = await ctx.db
      .query("productions")
      .withIndex("by_creation_time", (q: any) => q.gt("createdAt", start).lt("createdAt", end))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_creation_time", (q: any) => q.gt("date", start).lt("date", end))
      .collect();

    const totalRevenue = productions.reduce((sum, p) => sum + (p.clientPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return totalRevenue - totalExpenses;
  },
});

export const getProfitYearToDate = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const start = startOfYear(now).getTime();
    const end = now;

    const productions = await ctx.db
      .query("productions")
      .withIndex("by_creation_time", (q: any) => q.gt("createdAt", start).lt("createdAt", end))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_creation_time", (q: any) => q.gt("date", start).lt("date", end))
      .collect();

    const totalRevenue = productions.reduce((sum, p) => sum + (p.clientPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return totalRevenue - totalExpenses;
  },
});

export const getExpensesOverTime = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, { start, end }) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_creation_time", (q: any) => q.gt("date", start).lt("date", end))
      .collect();
    return expenses;
  },
});

export const getMostProfitableProductions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const productions = await ctx.db
      .query("productions")
      .withIndex("by_profit", (q) => q.gt("profit", 0))
      .collect();

    const sortedProductions = productions
      .filter(p => p.profit !== undefined && p.profit !== null)
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, limit || 10);

    const productionsWithClientNames = await Promise.all(
      sortedProductions.map(async (production) => {
        const client = await ctx.db.get(production.clientId);
        return {
          ...production,
          clientName: client ? client.name : "Unknown Client",
        };
      })
    );

    return productionsWithClientNames;
  },
});

export const getInventoryOverview = query({
  args: {},
  handler: async (ctx) => {
    const stockEntries = await ctx.db.query("stockEntries").collect();
    const materials = await ctx.db.query("materials").collect();

    let totalInventoryValue = 0;
    const lowStockMaterials: { materialName: string; currentStock: number; threshold: number }[] = [];

    const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

    for (const entry of stockEntries) {
      totalInventoryValue += entry.remainingQuantity * entry.pricePerUnit;
    }

    for (const material of materials) {
      const currentStock = stockEntries
        .filter(entry => entry.materialId.toString() === material._id.toString())
        .reduce((sum, entry) => sum + entry.remainingQuantity, 0);

      if (material.lowStockThreshold && currentStock < material.lowStockThreshold) {
        lowStockMaterials.push({
          materialName: material.name,
          currentStock,
          threshold: material.lowStockThreshold,
        });
      }
    }

    return {
      totalInventoryValue,
      lowStockMaterials,
    };
  },
});

export const getProductionVolumeOverTime = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, { start, end }) => {
    const productions = await ctx.db
      .query("productions")
      .withIndex("by_creation_time", (q: any) => q.gt("createdAt", start).lt("createdAt", end))
      .collect();
    return productions;
  },
});