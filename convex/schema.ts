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
    unit: v.optional(v.string()), // KG, Unit, Gz, M, cm, etc.
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

  stockConsumption: defineTable({
    stockEntryId: v.id('stockEntries'),
    productionId: v.optional(v.id('productions')),
    quantityUsed: v.number(),
    pricePerUnit: v.number(),
    dateConsumed: v.number(),
    notes: v.optional(v.string()),
  })
    .index('by_stock_entry', ['stockEntryId'])
    .index('by_production', ['productionId'])
    .index('by_production_material', ['productionId', 'stockEntryId']),

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

  productions: defineTable({
    clientId: v.id('clients'),
    articleName: v.string(),
    type: v.string(),
    totalPieces: v.number(),
    solidPieces: v.optional(v.number()),
    cuttingDate: v.optional(v.number()),
    stitchingDate: v.optional(v.number()),
    status: v.optional(v.string()),
    overheadCostPerPiece: v.optional(v.number()),
    totalOverhead: v.optional(v.number()),
    finalTotalCost: v.optional(v.number()),
    profit: v.optional(v.number()),
    cuttingCost: v.optional(v.number()),
    overlockedShirtCost: v.optional(v.number()),
    overlockedTrouserCost: v.optional(v.number()),
    flatShirtCost: v.optional(v.number()),
    flatTrouserCost: v.optional(v.number()),
    singleShirtCost: v.optional(v.number()),
    singleTrouserCost: v.optional(v.number()),
    threadingCost: v.optional(v.number()),
    clientPrice: v.optional(v.number()),
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    createdAt: v.optional(v.float64()),
    userId: v.id('users'),
  })
    .index('by_client', ['clientId'])
    .index('by_status', ['status'])
    .index('by_profit', ['profit'])
    .index('by_createdAt', ['createdAt']),

  productionMaterials: defineTable({
    productionId: v.id('productions'),
    materialId: v.id('materials'),
    quantity: v.number(),
  })
    .index('by_production', ['productionId'])
    .index('by_material', ['materialId']),

  expenses: defineTable({
    amount: v.number(),
    date: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
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
