import { defineSchema, defineTable } from 'convex/server';

import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    password: v.string(),
  }),

  materials: defineTable({
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    lowStockThreshold: v.optional(v.number()),
  }),

  stockEntries: defineTable({
    materialId: v.id('materials'),
    quantity: v.number(),
    pricePerUnit: v.number(),
    dateReceived: v.number(),
    supplierId: v.id('suppliers'),
    remainingQuantity: v.number(),
  })
    .index('by_material', ['materialId'])
    .index('by_supplier', ['supplierId'])
    .index('by_material_and_remaining', ['materialId', 'remainingQuantity']),

  suppliers: defineTable({
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }),

  clients: defineTable({
    name: v.string(),
    contactInfo: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_name', ['name']),

  productionOrders: defineTable({
    clientId: v.id('clients'),
    articleName: v.string(),
    type: v.string(),
    totalPieces: v.number(),
    solidPieces: v.optional(v.number()),
    cuttingDate: v.optional(v.number()),
    stitchingDate: v.optional(v.number()),
    status: v.string(),
    notes: v.optional(v.string()),
    cuttingCost: v.number(),
    overlockedShirtCost: v.number(),
    overlockedTrouserCost: v.number(),
    flatShirtCost: v.number(),
    flatTrouserCost: v.number(),
    singleShirtCost: v.number(),
    singleTrouserCost: v.number(),
    threadingCost: v.number(),
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    clientPrice: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_client', ['clientId'])
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  materialConsumptions: defineTable({
    productionOrderId: v.id('productionOrders'),
    materialId: v.id('materials'),
    stockEntryId: v.id('stockEntries'),
    quantityConsumed: v.number(),
    pricePerUnit: v.number(),
    totalCost: v.number(),
    consumedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index('by_production_order', ['productionOrderId'])
    .index('by_material', ['materialId'])
    .index('by_stock_entry', ['stockEntryId']),

  expenses: defineTable({
    amount: v.number(),
    date: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    userId: v.id('users'),
  }).index('by_date', ['date']),

  auditLogs: defineTable({
    userId: v.id('users'),
    actionType: v.string(),
    entityAffected: v.string(),
    entityId: v.string(),
    timestamp: v.number(),
    beforeValue: v.optional(v.any()),
    afterValue: v.optional(v.any()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_user', ['userId'])
    .index('by_entity', ['entityAffected', 'entityId']),
});
