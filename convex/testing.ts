import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const clearAllData = mutation({
  handler: async (ctx) => {
    const expense = await ctx.db.query('expenses').first();
    if (expense) {
      await ctx.db.delete(expense._id);
    }
    const production = await ctx.db.query('productions').first();
    if (production) {
      await ctx.db.delete(production._id);
    }
    const client = await ctx.db.query('clients').first();
    if (client) {
      await ctx.db.delete(client._id);
    }
    return { success: true, message: 'All data cleared.' };
  },
});

export const seedTestData = mutation({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    // Create test users first
    const user1Id = await ctx.db.insert('users', {
      name: 'Test User 1',
      password: 'password123',
    });
    const user2Id = await ctx.db.insert('users', {
      name: 'Test User 2', 
      password: 'password123',
    });

    const client1Id = await ctx.db.insert('clients', {
      name: 'Client A',
      createdAt: Date.now(),
      address: '123 Client St',
      contactInfo: 'clientA@example.com',
    });
    const client2Id = await ctx.db.insert('clients', {
      name: 'Client B',
      createdAt: Date.now(),
      address: '456 Client Ave',
      contactInfo: 'clientB@example.com',
    });

    const expenses = [
      {
        date: new Date(year, month, 5).getTime(),
        category: 'Rent',
        amount: 1000,
        note: 'Office rent',
      },
      {
        date: new Date(year, month, 10).getTime(),
        category: 'Utilities',
        amount: 200,
        note: 'Electricity bill',
      },
    ];

    for (const expense of expenses) {
      await ctx.db.insert('expenses', expense);
    }

    const productions = [
      {
        clientId: client1Id,
        articleName: 'Tracksuit Alpha',
        type: 'Tracksuit',
        totalPieces: 100,
        cuttingDate: new Date(year, month, 1).getTime(),
        status: 'Completed',
        cuttingCost: 10,
        overlockedShirtCost: 5,
        overlockedTrouserCost: 5,
        flatShirtCost: 5,
        flatTrouserCost: 5,
        singleShirtCost: 5,
        singleTrouserCost: 5,
        threadingCost: 5,
        clientPrice: 5.0,
        userId: user1Id, // Using proper user ID for testing
      },
      {
        clientId: client1Id,
        articleName: 'Hoodie Beta',
        type: 'Hoodie',
        totalPieces: 200,
        cuttingDate: new Date(year, month, 15).getTime(),
        status: 'Completed',
        cuttingCost: 12,
        overlockedShirtCost: 6,
        overlockedTrouserCost: 6,
        flatShirtCost: 6,
        flatTrouserCost: 6,
        singleShirtCost: 6,
        singleTrouserCost: 6,
        threadingCost: 6,
        clientPrice: 4.5,
        userId: user1Id, // Using proper user ID for testing
      },
      {
        clientId: client2Id,
        articleName: 'T-Shirt Gamma',
        type: 'T-Shirt',
        totalPieces: 50,
        cuttingDate: new Date(year, month, 20).getTime(),
        status: 'In Progress',
        cuttingCost: 8,
        overlockedShirtCost: 4,
        overlockedTrouserCost: 4,
        flatShirtCost: 4,
        flatTrouserCost: 4,
        singleShirtCost: 4,
        singleTrouserCost: 4,
        threadingCost: 4,
        clientPrice: 6.0,
        userId: user2Id, // Using proper user ID for testing
      },
    ];

    for (const production of productions) {
      await ctx.db.insert('productions', production);
    }

    return { success: true, message: 'Seed test data initiated.' };
  },
});
