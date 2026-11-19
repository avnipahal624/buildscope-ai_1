import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEMO_OPPORTUNITIES } from "./catalog";
import { logActivity, sanitize } from "./lib";

export const ensureCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("opportunities").first();
    if (existing) return { seeded: false };
    for (const record of DEMO_OPPORTUNITIES) {
      await ctx.db.insert("opportunities", sanitize(record));
    }
    return { seeded: true, count: DEMO_OPPORTUNITIES.length };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("opportunities").collect();
  },
});

export const saved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const out = [];
    for (const row of rows) {
      const opportunity = await ctx.db.get(row.opportunityId);
      if (opportunity) out.push({ saved: row, opportunity });
    }
    return out.sort((a, b) => b.saved.createdAt - a.saved.createdAt);
  },
});

export const toggleSave = mutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to save opportunities.");
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found.");

    const existing = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user_opportunity", (q) =>
        q.eq("userId", userId).eq("opportunityId", args.opportunityId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await logActivity(ctx, userId, {
        kind: "unsaved",
        title: `Removed ${opportunity.name} from saved`,
        href: "/saved",
      });
      return { saved: false };
    }

    await ctx.db.insert("savedOpportunities", {
      userId,
      opportunityId: args.opportunityId,
      createdAt: Date.now(),
    });
    await logActivity(ctx, userId, {
      kind: "saved",
      title: `Saved opportunity: ${opportunity.name}`,
      href: "/saved",
    });
    return { saved: true };
  },
});
