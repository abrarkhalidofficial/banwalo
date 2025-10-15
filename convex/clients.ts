import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Define TypeScript interfaces for client data
interface Client {
  _id: Id<"clients">;
  name: string;
  contactInfo: string;
  address: string;
  notes?: string;
  createdAt: number;
}

interface Production {
  _id: Id<"productions">;
  clientId: Id<"clients">;
  articleName: string;
  type: string;
  totalPieces: number;
  solidPieces?: number;
  status: string;
  clientPrice: number;
  cuttingDate?: number;
  stitchingDate?: number;
}

// List all clients
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});

// Get a single client by ID
export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new client
export const create = mutation({
  args: {
    name: v.string(),
    contactInfo: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const clientId = await ctx.db.insert("clients", {
      name: args.name,
      contactInfo: args.contactInfo || "",
      address: args.address || "",
      notes: args.notes,
      createdAt: Date.now(),
    });

    const afterValue = await ctx.db.get(clientId);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "create",
      entityAffected: "clients",
      entityId: String(clientId),
      afterValue: afterValue,
    });
    
    return clientId;
  },
});

// Update an existing client
export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingClient = await ctx.db.get(id);

    if (!existingClient) {
      throw new Error("Client not found");
    }

    const beforeValue = existingClient;

    await ctx.db.patch(id, updates);

    const afterValue = await ctx.db.get(id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "update",
      entityAffected: "clients",
      entityId: String(id),
      beforeValue: beforeValue,
      afterValue: afterValue,
    });

    return id;
  },
});

// Delete a client
export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    const userId = userIdentity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingClient = await ctx.db.get(args.id);

    if (!existingClient) {
      throw new Error("Client not found");
    }

    const beforeValue = existingClient;

    await ctx.db.delete(args.id);

    await ctx.runMutation(api.audit.createAuditLog, {
      userId: userId as Id<"users">,
      actionType: "delete",
      entityAffected: "clients",
      entityId: String(args.id),
      beforeValue: beforeValue,
    });

    return args.id;
  },
});

// Get productions for a specific client
export const getProductions = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});