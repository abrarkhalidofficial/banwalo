import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('suppliers').collect();
  },
});

export const getById = query({
  args: { id: v.id('suppliers') },
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
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const supplierId = await ctx.db.insert('suppliers', {
      name: args.name,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
      createdAt: Date.now(),
    });

    const afterValue = await ctx.db.get(supplierId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'suppliers',
      entityId: supplierId.toString(),
      afterValue: afterValue,
    });

    return supplierId;
  },
});

export const update = mutation({
  args: {
    id: v.id('suppliers'),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingSupplier = await ctx.db.get(id);

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    const beforeValue = existingSupplier;

    await ctx.db.patch(id, updates);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'update',
      entityAffected: 'suppliers',
      entityId: id.toString(),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('suppliers'), userId: v.id('users') },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingSupplier = await ctx.db.get(args.id);

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    const beforeValue = existingSupplier;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'suppliers',
      entityId: args.id.toString(),
      beforeValue: beforeValue,
    });

    return args.id;
  },
});
