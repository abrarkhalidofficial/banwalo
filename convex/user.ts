import { mutation, query } from './_generated/server';

import { v } from 'convex/values';

export const getUserDetails = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      name: user.name,
    };
  },
});

export const signIn = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.and(q.eq(q.field('name'), args.username), q.eq(q.field('password'), args.password)))
      .first();

    if (!user) {
      throw new Error('Invalid username or password');
    }
    return {
      id: user._id,
    };
  },
});
