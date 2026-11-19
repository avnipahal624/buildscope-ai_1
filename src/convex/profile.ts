import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { logActivity } from "./lib";

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    college: v.optional(v.string()),
    branch: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    domains: v.optional(v.array(v.string())),
    experienceLevel: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    weeklyHours: v.optional(v.number()),
    onboardingComplete: v.optional(v.boolean()),
    theme: v.optional(v.string()),
    notificationPrefs: v.optional(
      v.object({
        deadlines: v.boolean(),
        roadmap: v.boolean(),
        weeklyDigest: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to update your profile.");
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(userId, patch);

    if (args.onboardingComplete) {
      await logActivity(ctx, userId, {
        kind: "profile",
        title: "Completed your BuildScope profile",
        detail: "Recommendations and roadmap priorities are now personalised.",
        href: "/profile",
      });
    }
    return { ok: true };
  },
});
