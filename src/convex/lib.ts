import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Removes undefined keys recursively so untrusted JSON is a valid Convex value. */
export function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitize(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      out[key] = sanitize(entry);
    }
    return out as T;
  }
  return value;
}

export async function logActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  entry: { kind: string; title: string; detail?: string; href?: string },
) {
  await ctx.db.insert("activities", {
    userId,
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    href: entry.href,
    createdAt: Date.now(),
  });
}
