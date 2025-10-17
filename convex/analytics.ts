import { query } from './_generated/server';
import { v } from 'convex/values';

export const getInventoryOverview = query({
  args: {},
  handler: async (ctx) => {
    const stockEntries = await ctx.db.query('stockEntries').collect();
    const materials = await ctx.db.query('materials').collect();

    let totalInventoryValue = 0;
    const lowStockMaterials: {
      materialName: string;
      currentStock: number;
      threshold: number;
    }[] = [];

    for (const entry of stockEntries) {
      totalInventoryValue += entry.remainingQuantity * entry.pricePerUnit;
    }

    for (const material of materials) {
      const currentStock = stockEntries.filter((entry) => entry.materialId.toString() === material._id.toString()).reduce((sum, entry) => sum + entry.remainingQuantity, 0);

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

export const getMostProfitableProductions = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const productionOrders = await ctx.db.query('productionOrders').collect();
    const materialConsumptions = await ctx.db.query('materialConsumptions').collect();
    const allExpenses = await ctx.db.query('expenses').collect();

    const profitsByProduction = await Promise.all(
      productionOrders.map(async (order) => {
        const client = await ctx.db.get(order.clientId);
        const consumptionsForOrder = materialConsumptions.filter((c) => c.productionOrderId.toString() === order._id.toString());

        const totalMaterialCost = consumptionsForOrder.reduce((sum, c) => sum + c.totalCost, 0);

        // Calculate labor costs
        const laborCostPerUnit =
          (order.cuttingCost || 0) +
          (order.overlockedShirtCost || 0) +
          (order.overlockedTrouserCost || 0) +
          (order.flatShirtCost || 0) +
          (order.flatTrouserCost || 0) +
          (order.singleShirtCost || 0) +
          (order.singleTrouserCost || 0) +
          (order.threadingCost || 0);
        const totalLaborCost = laborCostPerUnit * order.totalPieces;

        // Calculate optional costs
        const totalOptionalCosts =
          (order.printingCost || 0) +
          (order.pocketZipCost || 0) +
          (order.doryCost || 0) +
          (order.fullZipCost || 0) +
          (order.elasticCost || 0) +
          (order.packingZipperCost || 0) +
          (order.packingShopperCost || 0) +
          (order.threadCost || 0);

        // Calculate allocated expenses
        const orderDate = new Date(order.createdAt);
        const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
        const monthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const expensesThisMonth = allExpenses.filter((e) => e.date >= monthStart.getTime() && e.date <= monthEnd.getTime());
        const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

        const ordersThisMonth = productionOrders.filter((o) => o.createdAt >= monthStart.getTime() && o.createdAt <= monthEnd.getTime());
        const allocatedExpense = ordersThisMonth.length > 0 ? totalExpensesThisMonth / ordersThisMonth.length : 0;

        const revenue = (order.clientPrice || 0) * order.totalPieces;
        const profit = revenue - totalMaterialCost - totalLaborCost - totalOptionalCosts - allocatedExpense;

        return {
          ...order,
          clientName: client?.name || 'Unknown Client',
          profit,
          revenue,
        };
      }),
    );

    return profitsByProduction.sort((a, b) => b.profit - a.profit).slice(0, args.limit);
  },
});

export const getExpensesOverTime = query({
  args: { start: v.number(), end: v.number() },
  handler: async (ctx, args) => {
    const expenses = await ctx.db.query('expenses').collect();

    const expensesByDate: Record<string, { date: string; amount: number; category: string }[]> = {};

    for (const e of expenses) {
      if (e.date >= args.start && e.date <= args.end) {
        const dateKey = new Date(e.date).toLocaleDateString();
        if (!expensesByDate[dateKey]) {
          expensesByDate[dateKey] = [];
        }
        expensesByDate[dateKey].push({
          date: dateKey,
          amount: e.amount,
          category: e.category,
        });
      }
    }

    return Object.values(expensesByDate).flat();
  },
});

export const getProductionVolumeOverTime = query({
  args: { start: v.number(), end: v.number() },
  handler: async (ctx, args) => {
    const productionOrders = await ctx.db.query('productionOrders').collect();

    const volumeByMonth: Record<string, { month: string; count: number; timestamp: number }> = {};

    for (const order of productionOrders) {
      if (order.createdAt >= args.start && order.createdAt <= args.end) {
        const date = new Date(order.createdAt);
        const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!volumeByMonth[month]) {
          volumeByMonth[month] = { month, count: 0, timestamp: date.getTime() };
        }
        volumeByMonth[month].count += order.totalPieces;
      }
    }

    return Object.values(volumeByMonth).sort((a, b) => a.timestamp - b.timestamp);
  },
});

export const getProfitThisMonth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const firstDayOfMonth = new Date(now);
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const productionOrders = await ctx.db.query('productionOrders').collect();
    const materialConsumptions = await ctx.db.query('materialConsumptions').collect();
    const allExpenses = await ctx.db.query('expenses').collect();

    const thisMonthOrders = productionOrders.filter((o) => o.createdAt >= firstDayOfMonth.getTime());

    // Calculate total expenses for this month
    const lastDayOfMonth = new Date(now);
    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    lastDayOfMonth.setDate(0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const thisMonthExpenses = allExpenses.filter((e) => e.date >= firstDayOfMonth.getTime() && e.date <= lastDayOfMonth.getTime());
    const totalExpensesThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allocatedExpensePerProduction = thisMonthOrders.length > 0 ? totalExpensesThisMonth / thisMonthOrders.length : 0;

    let totalProfit = 0;
    for (const order of thisMonthOrders) {
      const consumptions = materialConsumptions.filter((c) => c.productionOrderId.toString() === order._id.toString());
      const materialCost = consumptions.reduce((sum, c) => sum + c.totalCost, 0);

      // Calculate labor costs
      const laborCostPerUnit =
        (order.cuttingCost || 0) +
        (order.overlockedShirtCost || 0) +
        (order.overlockedTrouserCost || 0) +
        (order.flatShirtCost || 0) +
        (order.flatTrouserCost || 0) +
        (order.singleShirtCost || 0) +
        (order.singleTrouserCost || 0) +
        (order.threadingCost || 0);
      const totalLaborCost = laborCostPerUnit * order.totalPieces;

      // Calculate optional costs
      const totalOptionalCosts =
        (order.printingCost || 0) +
        (order.pocketZipCost || 0) +
        (order.doryCost || 0) +
        (order.fullZipCost || 0) +
        (order.elasticCost || 0) +
        (order.packingZipperCost || 0) +
        (order.packingShopperCost || 0) +
        (order.threadCost || 0);

      const revenue = (order.clientPrice || 0) * order.totalPieces;
      totalProfit += revenue - materialCost - totalLaborCost - totalOptionalCosts - allocatedExpensePerProduction;
    }

    return totalProfit;
  },
});

export const getProfitThisWeek = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const productionOrders = await ctx.db.query('productionOrders').collect();
    const materialConsumptions = await ctx.db.query('materialConsumptions').collect();
    const allExpenses = await ctx.db.query('expenses').collect();

    const thisWeekOrders = productionOrders.filter((o) => o.createdAt >= sevenDaysAgo);

    // Group orders by month and calculate expenses for each month
    const ordersByMonth: Record<
      string,
      {
        orders: typeof productionOrders;
        expenses: number;
      }
    > = {};

    for (const order of thisWeekOrders) {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

      if (!ordersByMonth[monthKey]) {
        const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
        const monthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const expensesThisMonth = allExpenses.filter((e) => e.date >= monthStart.getTime() && e.date <= monthEnd.getTime());
        const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

        ordersByMonth[monthKey] = {
          orders: [],
          expenses: totalExpensesThisMonth,
        };
      }
      ordersByMonth[monthKey].orders.push(order);
    }

    let totalProfit = 0;
    for (const order of thisWeekOrders) {
      const consumptions = materialConsumptions.filter((c) => c.productionOrderId.toString() === order._id.toString());
      const materialCost = consumptions.reduce((sum, c) => sum + c.totalCost, 0);

      // Calculate labor costs
      const laborCostPerUnit =
        (order.cuttingCost || 0) +
        (order.overlockedShirtCost || 0) +
        (order.overlockedTrouserCost || 0) +
        (order.flatShirtCost || 0) +
        (order.flatTrouserCost || 0) +
        (order.singleShirtCost || 0) +
        (order.singleTrouserCost || 0) +
        (order.threadingCost || 0);
      const totalLaborCost = laborCostPerUnit * order.totalPieces;

      // Calculate optional costs
      const totalOptionalCosts =
        (order.printingCost || 0) +
        (order.pocketZipCost || 0) +
        (order.doryCost || 0) +
        (order.fullZipCost || 0) +
        (order.elasticCost || 0) +
        (order.packingZipperCost || 0) +
        (order.packingShopperCost || 0) +
        (order.threadCost || 0);

      // Calculate allocated expense
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
      const monthData = ordersByMonth[monthKey];
      const allocatedExpense = monthData.orders.length > 0 ? monthData.expenses / monthData.orders.length : 0;

      const revenue = (order.clientPrice || 0) * order.totalPieces;
      totalProfit += revenue - materialCost - totalLaborCost - totalOptionalCosts - allocatedExpense;
    }

    return totalProfit;
  },
});

export const getProfitYearToDate = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const firstDayOfYear = new Date(now);
    firstDayOfYear.setMonth(0);
    firstDayOfYear.setDate(1);
    firstDayOfYear.setHours(0, 0, 0, 0);

    const productionOrders = await ctx.db.query('productionOrders').collect();
    const materialConsumptions = await ctx.db.query('materialConsumptions').collect();
    const allExpenses = await ctx.db.query('expenses').collect();

    const yearToDateOrders = productionOrders.filter((o) => o.createdAt >= firstDayOfYear.getTime());

    // Group orders by month and calculate expenses for each month
    const ordersByMonth: Record<
      string,
      {
        orders: typeof productionOrders;
        expenses: number;
      }
    > = {};

    for (const order of yearToDateOrders) {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

      if (!ordersByMonth[monthKey]) {
        const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
        const monthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const expensesThisMonth = allExpenses.filter((e) => e.date >= monthStart.getTime() && e.date <= monthEnd.getTime());
        const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

        ordersByMonth[monthKey] = {
          orders: [],
          expenses: totalExpensesThisMonth,
        };
      }
      ordersByMonth[monthKey].orders.push(order);
    }

    let totalProfit = 0;
    for (const order of yearToDateOrders) {
      const consumptions = materialConsumptions.filter((c) => c.productionOrderId.toString() === order._id.toString());
      const materialCost = consumptions.reduce((sum, c) => sum + c.totalCost, 0);

      // Calculate labor costs
      const laborCostPerUnit =
        (order.cuttingCost || 0) +
        (order.overlockedShirtCost || 0) +
        (order.overlockedTrouserCost || 0) +
        (order.flatShirtCost || 0) +
        (order.flatTrouserCost || 0) +
        (order.singleShirtCost || 0) +
        (order.singleTrouserCost || 0) +
        (order.threadingCost || 0);
      const totalLaborCost = laborCostPerUnit * order.totalPieces;

      // Calculate optional costs
      const totalOptionalCosts =
        (order.printingCost || 0) +
        (order.pocketZipCost || 0) +
        (order.doryCost || 0) +
        (order.fullZipCost || 0) +
        (order.elasticCost || 0) +
        (order.packingZipperCost || 0) +
        (order.packingShopperCost || 0) +
        (order.threadCost || 0);

      // Calculate allocated expense
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
      const monthData = ordersByMonth[monthKey];
      const allocatedExpense = monthData.orders.length > 0 ? monthData.expenses / monthData.orders.length : 0;

      const revenue = (order.clientPrice || 0) * order.totalPieces;
      totalProfit += revenue - materialCost - totalLaborCost - totalOptionalCosts - allocatedExpense;
    }

    return totalProfit;
  },
});
