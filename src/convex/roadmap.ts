import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, sanitize } from "./lib";

const stageValidator = v.union(
  v.literal("foundation"),
  v.literal("intermediate"),
  v.literal("application"),
  v.literal("project-ready"),
);

const priorityValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const taskStatus = v.union(
  v.literal("todo"),
  v.literal("in-progress"),
  v.literal("done"),
);

async function requireUser(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in to manage your roadmap.");
  return userId;
}

export const state = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { targets: [], tasks: [], activeTarget: null };
    const targets = await ctx.db
      .query("roadmapTargets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const tasks = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    tasks.sort((a, b) => a.order - b.order);
    return {
      targets: targets.sort((a, b) => b.createdAt - a.createdAt),
      tasks,
      activeTarget: targets.find((target) => target.active) ?? null,
    };
  },
});

export const setTarget = mutation({
  args: {
    label: v.string(),
    type: v.union(
      v.literal("opportunity"),
      v.literal("project"),
      v.literal("goal"),
    ),
    referenceId: v.optional(v.string()),
    requiredSkills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("roadmapTargets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const target of existing) {
      if (target.active) await ctx.db.patch(target._id, { active: false });
    }
    const targetId = await ctx.db.insert("roadmapTargets", {
      userId,
      label: args.label,
      type: args.type,
      referenceId: args.referenceId,
      requiredSkills: args.requiredSkills,
      active: true,
      createdAt: Date.now(),
    });
    await logActivity(ctx, userId, {
      kind: "roadmap",
      title: `Set roadmap target: ${args.label}`,
      detail: `${args.requiredSkills.length} required skills analysed.`,
      href: "/roadmap",
    });
    return targetId;
  },
});

export const addTasks = mutation({
  args: {
    targetId: v.optional(v.id("roadmapTargets")),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        skill: v.string(),
        stage: stageValidator,
        priority: priorityValidator,
        estimatedMinutes: v.number(),
        resourceLabel: v.optional(v.string()),
        resourceUrl: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let order = existing.length;
    const ids = [];
    for (const task of args.tasks) {
      const id = await ctx.db.insert(
        "roadmapTasks",
        sanitize({
          userId,
          targetId: args.targetId,
          ...task,
          status: "todo",
          order,
          createdAt: Date.now(),
        }),
      );
      order += 1;
      ids.push(id);
    }
    await logActivity(ctx, userId, {
      kind: "roadmap",
      title: `Added ${args.tasks.length} roadmap task${args.tasks.length === 1 ? "" : "s"}`,
      href: "/roadmap",
    });
    return ids;
  },
});

export const addTask = mutation({
  args: {
    targetId: v.optional(v.id("roadmapTargets")),
    title: v.string(),
    description: v.string(),
    skill: v.string(),
    stage: stageValidator,
    priority: priorityValidator,
    estimatedMinutes: v.number(),
    resourceLabel: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const { targetId, ...rest } = args;
    const id = await ctx.db.insert(
      "roadmapTasks",
      sanitize({
        userId,
        targetId,
        ...rest,
        status: "todo",
        order: existing.length,
        createdAt: Date.now(),
      }),
    );
    await logActivity(ctx, userId, {
      kind: "roadmap",
      title: `Added learning task: ${args.title}`,
      detail: args.skill,
      href: "/roadmap",
    });
    return id;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("roadmapTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    skill: v.optional(v.string()),
    stage: v.optional(stageValidator),
    priority: v.optional(priorityValidator),
    estimatedMinutes: v.optional(v.number()),
    resourceLabel: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    status: v.optional(taskStatus),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found.");
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (key !== "taskId" && value !== undefined) patch[key] = value;
    }
    if (args.status === "done" && task.status !== "done") {
      patch.completedAt = Date.now();
    }
    await ctx.db.patch(args.taskId, patch);
    if (args.status === "done" && task.status !== "done") {
      await logActivity(ctx, userId, {
        kind: "roadmap",
        title: `Completed learning task: ${task.title}`,
        detail: `${task.skill} · ${Math.round(task.estimatedMinutes / 60)}h`,
        href: "/roadmap",
      });
    }
    return { ok: true };
  },
});

export const removeTask = mutation({
  args: { taskId: v.id("roadmapTasks") },
  handler: async (ctx, { taskId }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found.");
    await ctx.db.delete(taskId);
    return { ok: true };
  },
});

export const removeTarget = mutation({
  args: { targetId: v.id("roadmapTargets") },
  handler: async (ctx, { targetId }) => {
    const userId = await requireUser(ctx);
    const target = await ctx.db.get(targetId);
    if (!target || target.userId !== userId) throw new Error("Target not found.");
    const tasks = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const task of tasks) {
      if (task.targetId === targetId) await ctx.db.delete(task._id);
    }
    await ctx.db.delete(targetId);
    return { ok: true };
  },
});
