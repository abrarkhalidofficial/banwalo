import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createAuditLog = mutation({
  args: {
    userId: v.id('users'),
    actionType: v.string(),
    entityAffected: v.string(),
    entityId: v.string(),
    beforeValue: v.optional(v.any()),
    afterValue: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('auditLogs', {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getAuditLogs = query({
  handler: async (ctx) => {
    return await ctx.db.query('auditLogs').order('desc').collect();
  },
});
