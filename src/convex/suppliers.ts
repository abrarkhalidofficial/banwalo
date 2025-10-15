import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const supplierId = await ctx.db.insert("suppliers", {
      name: args.name,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
      createdAt: Date.now(),
    });

    const afterValue = await ctx.db.get(supplierId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "create",
      entityAffected: "suppliers",
      entityId: supplierId.toString(),
      afterValue: afterValue,
    });
    
    return supplierId;
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingSupplier = await ctx.db.get(id);

    if (!existingSupplier) {
      throw new Error("Supplier not found");
    }

    const beforeValue = existingSupplier;

    await ctx.db.patch(id, updates);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "update",
      entityAffected: "suppliers",
      entityId: id.toString(),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingSupplier = await ctx.db.get(args.id);

    if (!existingSupplier) {
      throw new Error("Supplier not found");
    }

    const beforeValue = existingSupplier;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "delete",
      entityAffected: "suppliers",
      entityId: args.id.toString(),
      beforeValue: beforeValue,
    });

    return args.id;
  },
});