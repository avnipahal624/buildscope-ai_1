"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Real GitHub REST API analysis. No fabricated metrics: every value below comes
 * from api.github.com and every limitation is reported explicitly. Similarity
 * figures use one documented method (concept token overlap) and are never
 * labelled as code similarity or plagiarism.
 */

const API = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "BuildScope-Evidence-Checker",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function gh(path: string): Promise<any | null> {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) {
    throw new Error(
      "GitHub rate limit reached. Wait a few minutes, or add a GITHUB_TOKEN to raise the limit.",
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub responded with ${res.status} for ${path}.`);
  }
  return await res.json();
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "of", "to", "in", "on", "is",
  "are", "app", "application", "project", "using", "built", "build", "this",
  "that", "my", "your", "from", "by", "as", "at", "it", "its",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

function parseRepoUrl(
  input: string,
): { owner: string; name: string } | null {
  const trimmed = input.trim();
  const https = trimmed.match(
    /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i,
  );
  if (https) {
    return { owner: https[1], name: https[2].replace(/\.git$/i, "") };
  }
  const ssh = trimmed.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (ssh) return { owner: ssh[1], name: ssh[2] };
  return null;
}

export const analyzeRepo = action({
  args: { repoUrl: v.string() },
  handler: async (_ctx, { repoUrl }) => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return {
        status: "unavailable" as const,
        repoUrl,
        owner: "",
        repoName: "",
        error:
          "That is not a valid public GitHub repository URL. Use https://github.com/owner/repo.",
      };
    }
    const { owner, name } = parsed;
    try {
      const repo = await gh(`/repos/${owner}/${name}`);
      if (!repo) {
        return {
          status: "unavailable" as const,
          repoUrl,
          owner,
          repoName: name,
          error:
            "Repository not found. It may be private, renamed or deleted — BuildScope only reads public repositories.",
        };
      }

      const limitations: string[] = [
        "Public GitHub metadata only. Private repository activity is not visible.",
        "Commit activity is sampled from the latest 30 commits, not the full history.",
        "Normalised code similarity and AST structural similarity are not implemented, so they are reported as Not assessed.",
        "Concept similarity is description/topic token overlap and is not evidence of copying.",
      ];

      const [languages, branches, commits, releases] = await Promise.all([
        gh(`/repos/${owner}/${name}/languages`).catch(() => null),
        gh(`/repos/${owner}/${name}/branches?per_page=100`).catch(() => null),
        gh(`/repos/${owner}/${name}/commits?per_page=30`).catch(() => null),
        gh(`/repos/${owner}/${name}/releases?per_page=1`).catch(() => null),
      ]);

      const tree = await gh(
        `/repos/${owner}/${name}/git/trees/${repo.default_branch}?recursive=1`,
      ).catch(() => null);
      const treeEntries: any[] = tree?.tree ?? [];
      const fileFingerprints = treeEntries
        .filter((entry) => entry.type === "blob")
        .slice(0, 400)
        .map((entry) => ({ path: entry.path as string, sha: entry.sha as string }));
      const structure = treeEntries
        .filter((entry) => !String(entry.path).startsWith(".git/"))
        .slice(0, 60)
        .map((entry) => ({
          path: entry.path as string,
          type: entry.type as string,
          ...(typeof entry.size === "number" ? { size: entry.size } : {}),
        }));
      const workflowFiles = treeEntries
        .map((entry) => String(entry.path))
        .filter((path) => path.startsWith(".github/workflows/"));
      const readmeEntry = treeEntries.find((entry) =>
        /^readme(\.md|\.markdown|\.txt)?$/i.test(String(entry.path)),
      );

      let dependencies: { name: string; version: string; ecosystem: string }[] =
        [];
      const pkgEntry = treeEntries.find((entry) => entry.path === "package.json");
      if (pkgEntry) {
        const pkg = await gh(
          `/repos/${owner}/${name}/contents/package.json`,
        ).catch(() => null);
        if (pkg?.content) {
          try {
            const parsedPkg = JSON.parse(
              Buffer.from(pkg.content, "base64").toString("utf8"),
            );
            dependencies = Object.entries({
              ...(parsedPkg.dependencies ?? {}),
              ...(parsedPkg.devDependencies ?? {}),
            })
              .slice(0, 40)
              .map(([dep, version]) => ({
                name: dep,
                version: String(version),
                ecosystem: "npm",
              }));
          } catch {
            limitations.push("package.json could not be parsed.");
          }
        }
      }

      const commitList: any[] = Array.isArray(commits) ? commits : [];
      const recentCommits = commitList.slice(0, 10).map((commit) => ({
        sha: String(commit.sha).slice(0, 7),
        message: String(commit.commit?.message ?? "").split("\n")[0].slice(0, 120),
        date: commit.commit?.author?.date ?? "",
        author: commit.author?.login ?? commit.commit?.author?.name ?? null,
      }));
      const eightWeeksAgo = Date.now() - 1000 * 60 * 60 * 24 * 56;
      const recentCount = commitList.filter(
        (commit) =>
          new Date(commit.commit?.author?.date ?? 0).getTime() > eightWeeksAgo,
      ).length;
      const commitsPerWeek = commitList.length === 0
        ? 0
        : Math.round((recentCount / 8) * 10) / 10;

      const languageList = languages
        ? Object.entries(languages as Record<string, number>)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([language, bytes]) => ({ language, bytes }))
        : [];

      // ---- Provenance: related repositories + fork ancestry ----------------
      const licenseSpdx = repo.license?.spdx_id ?? null;
      let related: any[] = [];
      const baseTokens = tokens(
        `${repo.description ?? ""} ${(repo.topics ?? []).join(" ")} ${repo.language ?? ""}`,
      );
      if (baseTokens.size >= 3) {
        const query = [
          ...Array.from(baseTokens).slice(0, 4),
          repo.language ? `language:${repo.language}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        const search = await gh(
          `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=8`,
        ).catch(() => null);
        const candidates: any[] = (search?.items ?? []).filter(
          (item: any) =>
            item.full_name.toLowerCase() !== `${owner}/${name}`.toLowerCase(),
        );
        const blobSet = new Set(fileFingerprints.map((file) => file.sha));
        const topCandidates = candidates.slice(0, 3);

        for (const candidate of topCandidates) {
          const [candidateOwner, candidateName] =
            String(candidate.full_name).split("/");
          const candidateTree = await gh(
            `/repos/${candidateOwner}/${candidateName}/git/trees/${candidate.default_branch}?recursive=1`,
          ).catch(() => null);
          const candidateBlobs: string[] = (candidateTree?.tree ?? [])
            .filter((entry: any) => entry.type === "blob")
            .map((entry: any) => entry.sha);
          const sharedShas = candidateBlobs.filter((sha) => blobSet.has(sha));
          const candidateBySha = new Map<string, string>();
          for (const entry of candidateTree?.tree ?? []) {
            if (entry.type === "blob") candidateBySha.set(entry.sha, entry.path);
          }
          const concept = Math.round(
            jaccard(
              baseTokens,
              tokens(
                `${candidate.description ?? ""} ${(candidate.topics ?? []).join(" ")} ${candidate.language ?? ""}`,
              ),
            ) * 100,
          );
          const candidateLicense = candidate.license?.spdx_id ?? null;
          related.push({
            fullName: candidate.full_name,
            url: candidate.html_url,
            description: candidate.description ?? null,
            stars: candidate.stargazers_count ?? 0,
            updatedAt: candidate.pushed_at ?? null,
            license: candidateLicense,
            conceptSimilarity: concept,
            sharedBlobFiles: sharedShas.length,
            sharedFilePaths: sharedShas
              .map((sha) => candidateBySha.get(sha))
              .filter((path): path is string => Boolean(path))
              .slice(0, 6),
            licenceComparison:
              !licenseSpdx || !candidateLicense
                ? "unknown"
                : licenseSpdx === candidateLicense
                  ? "same"
                  : "different",
            candidateIsFork: Boolean(candidate.fork),
          });
        }
        related = related.filter(
          (item) => item.conceptSimilarity > 0 || item.sharedBlobFiles > 0,
        );
        related.sort(
          (a, b) =>
            b.sharedBlobFiles - a.sharedBlobFiles ||
            b.conceptSimilarity - a.conceptSimilarity,
        );
        if (related.length === 0) {
          limitations.push(
            "No related public repositories were returned by GitHub search for this description.",
          );
        }
      } else {
        limitations.push(
          "Not enough description or topics to search for related repositories.",
        );
      }

      let parent: string | null = repo.parent?.full_name ?? null;
      let source: string | null = repo.source?.full_name ?? null;
      const ancestors: string[] = [];
      if (repo.fork && repo.parent?.full_name) {
        ancestors.push(repo.parent.full_name);
        const grandparent = await gh(
          `/repos/${repo.parent.full_name}`,
        ).catch(() => null);
        if (grandparent?.parent?.full_name) {
          ancestors.push(grandparent.parent.full_name);
        }
      }

      const report = {
        dataStatus: "verified" as const,
        repoUrl: repo.html_url ?? repoUrl,
        owner: repo.owner?.login ?? owner,
        name: repo.name ?? name,
        description: repo.description ?? null,
        homepage: repo.homepage ?? null,
        visibility: repo.visibility ?? "public",
        createdAt: repo.created_at ?? null,
        updatedAt: repo.updated_at ?? null,
        pushedAt: repo.pushed_at ?? null,
        stars: repo.stargazers_count ?? 0,
        forks: repo.forks_count ?? 0,
        watchers: repo.subscribers_count ?? repo.watchers_count ?? 0,
        openIssues: repo.open_issues_count ?? 0,
        language: repo.language ?? null,
        languages: languageList,
        license: licenseSpdx,
        licenseName: repo.license?.name ?? null,
        defaultBranch: repo.default_branch ?? "main",
        branches: Array.isArray(branches)
          ? branches.map((branch: any) => branch.name).slice(0, 40)
          : [],
        branchCount: Array.isArray(branches) ? branches.length : 0,
        commitSampleSize: commitList.length,
        commitsPerWeek,
        lastCommitAt: recentCommits[0]?.date ?? null,
        recentCommits,
        readmePresent: Boolean(readmeEntry),
        readmePath: readmeEntry?.path ?? null,
        releases: Array.isArray(releases) ? releases.length : 0,
        latestRelease: Array.isArray(releases) && releases[0]
          ? releases[0].tag_name
          : null,
        topics: repo.topics ?? [],
        hasWorkflows: workflowFiles.length > 0,
        workflowFiles: workflowFiles.slice(0, 20),
        dependencies,
        structure,
        fileFingerprints,
        fileCount: fileFingerprints.length,
        isFork: Boolean(repo.fork),
        parent,
        source,
        ancestors,
        related,
        limitations,
        checkedAt: Date.now(),
      };

      return {
        status: "verified" as const,
        repoUrl: report.repoUrl,
        owner: report.owner,
        repoName: report.name,
        report,
        error: null,
      };
    } catch (error) {
      return {
        status: "unavailable" as const,
        repoUrl,
        owner,
        repoName: name,
        error:
          error instanceof Error
            ? error.message
            : "GitHub could not be reached. Try again shortly.",
      };
    }
  },
});
