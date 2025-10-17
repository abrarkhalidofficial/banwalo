import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('clients').collect();
  },
});

export const get = query({
  args: { id: v.id('clients') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contactInfo: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const clientId = await ctx.db.insert('clients', {
      name: args.name,
      contactInfo: args.contactInfo || '',
      address: args.address || '',
      notes: args.notes,
      createdAt: args.createdAt,
    });

    const afterValue = await ctx.db.get(clientId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'clients',
      entityId: String(clientId),
      afterValue: afterValue,
    });

    return clientId;
  },
});

export const update = mutation({
  args: {
    id: v.id('clients'),
    name: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingClient = await ctx.db.get(id);

    if (!existingClient) {
      throw new Error('Client not found');
    }

    const beforeValue = existingClient;

    await ctx.db.patch(id, updates);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'update',
      entityAffected: 'clients',
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('clients'), userId: v.id('users') },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingClient = await ctx.db.get(args.id);

    if (!existingClient) {
      throw new Error('Client not found');
    }

    const beforeValue = existingClient;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'clients',
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return args.id;
  },
});

export const getProductions = query({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('productionOrders')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();
  },
});
