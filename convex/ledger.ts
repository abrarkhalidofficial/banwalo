import { mutation, query } from './_generated/server';

import { api } from './_generated/api';
import { v } from 'convex/values';

export const createExpense = mutation({
  args: {
    date: v.number(),
    category: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const expenseId = await ctx.db.insert('expenses', {
      date: args.date,
      category: args.category,
      amount: args.amount,
      note: args.note,
      userId: args.userId,
    });

    const afterValue = await ctx.db.get(expenseId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'create',
      entityAffected: 'expenses',
      entityId: String(expenseId),
      afterValue: afterValue,
    });

    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id('expenses'),
    date: v.optional(v.number()),
    category: v.optional(v.string()),
    amount: v.optional(v.number()),
    note: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const existingExpense = await ctx.db.get(id);

    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    const beforeValue = existingExpense;

    await ctx.db.patch(id, updates);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId,
      actionType: 'update',
      entityAffected: 'expenses',
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return id;
  },
});

export const removeExpense = mutation({
  args: { id: v.id('expenses'), userId: v.id('users') },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('Not authenticated');
    }

    const existingExpense = await ctx.db.get(args.id);

    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    const beforeValue = existingExpense;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: args.userId,
      actionType: 'delete',
      entityAffected: 'expenses',
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return args.id;
  },
});

export const listExpenses = query({
  args: {
    filterDate: v.optional(v.number()),
    filterCategory: v.optional(v.string()),
  },
  handler: async (ctx, { filterDate, filterCategory }) => {
    let expenses = await ctx.db.query('expenses').order('desc').collect();

    if (filterDate) {
      const startOfDay = new Date(filterDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate).setHours(23, 59, 59, 999);
      expenses = expenses.filter((expense) => expense.date >= startOfDay && expense.date <= endOfDay);
    }

    if (filterCategory) {
      expenses = expenses.filter((expense) => expense.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    return expenses;
  },
});

export const getTotalExpensesForMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0).getTime();

    const expensesInMonth = await ctx.db
      .query('expenses')
      .filter((q) => q.and(q.gte(q.field('date'), startOfMonth), q.lte(q.field('date'), endOfMonth)))
      .collect();

    const totalExpenses = expensesInMonth.reduce((sum, expense) => sum + expense.amount, 0);
    return totalExpenses;
  },
});

export const getMonthlyExpenseSummaries = query({
  handler: async (ctx) => {
    const allExpenses = await ctx.db.query('expenses').collect();

    const monthlySummaries: {
      [key: string]: { year: number; month: number; totalAmount: number };
    } = {};

    for (const expense of allExpenses) {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!monthlySummaries[key]) {
        monthlySummaries[key] = { year, month, totalAmount: 0 };
      }
      monthlySummaries[key].totalAmount += expense.amount;
    }

    const sortedSummaries = Object.values(monthlySummaries).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.month - b.month;
    });

    return sortedSummaries;
  },
});
