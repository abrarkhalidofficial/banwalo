import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { createAuditLog } from "./audit";
import { api } from "./_generated/api";

// List all materials
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("materials").collect();
  },
});

// Get a material by ID
export const getById = query({
  args: { id: v.id("materials") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get material usage history across productions
export const getMaterialUsageHistory = query({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    try {
      // Get all stock consumption records for this material
      const stockEntries = await ctx.db
        .query("stockEntries")
        .withIndex("by_material", (q) => q.eq("materialId", args.materialId))
        .collect();
      
      if (!stockEntries.length) return [];
      
      const stockEntryIds = stockEntries.map(entry => entry._id);
      
      // Get all consumption records for these stock entries
      const consumptionRecords = [];
      for (const stockEntryId of stockEntryIds) {
        const records = await ctx.db
          .query("stockConsumption")
          .withIndex("by_stock_entry", (q) => q.eq("stockEntryId", stockEntryId))
          .collect();
        
        consumptionRecords.push(...records);
      }
      
      // Group by production
      const productionMap = new Map();
      
      for (const record of consumptionRecords) {
        const prodId = record.productionId;
        if (!prodId) continue;
        
        if (!productionMap.has(prodId.toString())) {
          const production = await ctx.db.get(prodId);
          if (!production) continue; // Skip if production not found
          
          productionMap.set(prodId.toString(), {
            productionId: prodId,
            productionName: production.articleName || "Unknown Production",
            dateUsed: record.dateConsumed || Date.now(),
            totalQuantity: 0,
            totalCost: 0,
          });
        }
        
        const entry = productionMap.get(prodId.toString());
        entry.totalQuantity += record.quantityUsed || 0;
        entry.totalCost += (record.quantityUsed || 0) * (record.pricePerUnit || 0);
        
        // Use the earliest date
        if (record.dateConsumed && record.dateConsumed < entry.dateUsed) {
          entry.dateUsed = record.dateConsumed;
        }
      }
      
      // Convert map to array and calculate average cost
      const usageHistory = Array.from(productionMap.values()).map(entry => ({
        ...entry,
        quantity: entry.totalQuantity,
        averageCost: entry.totalQuantity > 0 ? entry.totalCost / entry.totalQuantity : 0
      }));
      
      // Sort by date (newest first)
      return usageHistory.sort((a, b) => b.dateUsed - a.dateUsed);
    } catch (error) {
      console.error("Error in getMaterialUsageHistory:", error);
      return []; // Return empty array on error
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
    const materialId = await ctx.db.insert("materials", {
      name: args.name,
      type: args.type,
      description: args.description,
      lowStockThreshold: args.lowStockThreshold,
      createdAt: Date.now(),
    });

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await ctx.runMutation(api.audit.createAuditLog, {
        userId: identity.subject as Id<"users">,
        actionType: "create",
        entityAffected: "materials",
        entityId: String(materialId),
        afterValue: args,
      });
    }
    
    return materialId;
  },
});

export const update = mutation({
  args: {
    id: v.id("materials"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingMaterial = await ctx.db.get(args.id);
    if (!existingMaterial) {
      throw new Error("Material not found");
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
        userId: identity.subject as Id<"users">,
        actionType: "update",
        entityAffected: "materials",
        entityId: String(args.id),
        beforeValue: existingMaterial,
        afterValue: args,
      });
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("materials"),
  },
  handler: async (ctx, args) => {
    const existingMaterial = await ctx.db.get(args.id);
    if (!existingMaterial) {
      throw new Error("Material not found");
    }

    await ctx.db.delete(args.id);

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await ctx.runMutation(api.audit.createAuditLog, {
        userId: identity.subject as Id<"users">,
        actionType: "delete",
        entityAffected: "materials",
        entityId: String(args.id),
        beforeValue: existingMaterial,
      });
    }
  },
});