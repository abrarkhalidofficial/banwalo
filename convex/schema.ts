import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),

  }).index("by_clerk_id", ["clerkId"]),

  materials: defineTable({
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    lowStockThreshold: v.optional(v.number()), // Threshold for low stock alerts
  }),

  stockEntries: defineTable({
    materialId: v.id("materials"),
    quantity: v.number(),
    pricePerUnit: v.number(),
    dateReceived: v.number(),
    supplierId: v.id("suppliers"),
    remainingQuantity: v.number(),
  })
  .index("by_material", ["materialId"])
  .index("by_supplier", ["supplierId"])
  .index("by_material_and_remaining", ["materialId", "remainingQuantity"]),

  stockConsumption: defineTable({
    stockEntryId: v.id("stockEntries"),
    productionId: v.optional(v.id("productions")),
    quantityUsed: v.number(),
    pricePerUnit: v.number(),
    dateConsumed: v.number(),
    notes: v.optional(v.string()),
  })
  .index("by_stock_entry", ["stockEntryId"])
  .index("by_production", ["productionId"])
  .index("by_production_material", ["productionId", "stockEntryId"]),

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
  }).index("by_name", ["name"]),

  productions: defineTable({
    clientId: v.id("clients"),
    articleName: v.string(),
    type: v.string(), // Tracksuit, Hoodie, etc.
    totalPieces: v.number(),
    solidPieces: v.optional(v.number()),
    cuttingDate: v.optional(v.number()),
    stitchingDate: v.optional(v.number()),
    status: v.string(), // Planning, In Progress, Completed, Delivered

    // New fields for overhead calculation
    overheadCostPerPiece: v.optional(v.number()),
    totalOverhead: v.optional(v.number()),
    finalTotalCost: v.optional(v.number()),
    profit: v.optional(v.number()),

    // Labor costs (per piece)
    cuttingCost: v.number(),
    overlockedShirtCost: v.number(),
    overlockedTrouserCost: v.number(),
    flatShirtCost: v.number(),
    flatTrouserCost: v.number(),
    singleShirtCost: v.number(),
    singleTrouserCost: v.number(),
    threadingCost: v.number(),
    clientPrice: v.optional(v.number()), // Made optional

    // Optional costs (per piece)
    printingCost: v.optional(v.number()),
    pocketZipCost: v.optional(v.number()),
    doryCost: v.optional(v.number()),
    fullZipCost: v.optional(v.number()),
    elasticCost: v.optional(v.number()),
    packingZipperCost: v.optional(v.number()),
    packingShopperCost: v.optional(v.number()),
    threadCost: v.optional(v.number()),
    createdAt: v.optional(v.float64()),
  }).index("by_client", ["clientId"]).index("by_status", ["status"]).index("by_profit", ["profit"]).index("by_createdAt", ["createdAt"]),

  productionMaterials: defineTable({
    productionId: v.id("productions"),
    materialId: v.id("materials"),
    quantity: v.number(),
  }).index("by_production", ["productionId"]).index("by_material", ["materialId"]),

  expenses: defineTable({
    amount: v.number(),
    date: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
  }).index("by_date", ["date"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    actionType: v.string(), // e.g., 'create', 'update', 'delete'
    entityAffected: v.string(), // e.g., 'materials', 'productions'
    entityId: v.string(), // ID of the affected document
    timestamp: v.number(),
    beforeValue: v.optional(v.any()), // Snapshot of the document before the change
    afterValue: v.optional(v.any()), // Snapshot of the document after the change
  }).index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_entity", ["entityAffected", "entityId"]),
});