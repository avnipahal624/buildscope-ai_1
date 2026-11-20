/**
 * Single integration point for the existing FastAPI backend.
 *
 * In development the Vite dev server proxies `/backend` to
 * BUILDSCOPE_API_TARGET (default: the deployed Render backend), which avoids
 * the backend's origin allow-list blocking the preview. In a deployed build,
 * set VITE_API_BASE_URL to the FastAPI origin and add that origin to the
 * backend's CORS allow-list.
 */
const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const BASE_URL = (configuredBase?.replace(/\/+$/, "") || (import.meta.env.DEV ? "/backend" : "https://buildscope-backend.onrender.com"));

export const API_BASE_LABEL = configuredBase
  ? configuredBase
  : import.meta.env.DEV
    ? "the deployed FastAPI service (via the development proxy)"
    : "https://buildscope-backend.onrender.com";

export type JobStatus = "pending" | "running" | "completed" | "completed_with_errors" | "failed";
export type AuthSession = { access_token: string; token_type: string; user: { id: string; email: string } };
export type ResearchProviderStatus = { provider: string; configured: boolean; search_available: boolean; fetch_available: boolean; note: string };

export type Project = {
  id: string;
  name: string;
  description: string;
  problem_statement: string;
  target_users: string[];
  keywords: string[];
  planned_features: string[];
  status: string;
  created_at: string;
};

export type ProjectCreateInput = {
  name: string;
  description: string;
  problem_statement: string;
  target_users: string[];
  keywords: string[];
  planned_features: string[];
};

export type ResearchJob = {
  id: string;
  project_id: string;
  kind: "research" | "stakeholders" | string;
  status: JobStatus;
  queries: string[];
  scope: {
    stage?: string;
    counts?: Record<string, number>;
    coverage_note?: string;
    [key: string]: unknown;
  };
  usage: Record<string, number | string>;
  log: Array<string | { level?: string; message?: string; [key: string]: unknown }>;
  error: string | null;
  model_version: string;
  prompt_version: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type SimilarProject = {
  id: string;
  run_id: string;
  source_id: string;
  name: string;
  source_url: string;
  description: string | null;
  problem_solved: string | null;
  target_users: string[];
  features: string[];
  technology: string[];
  limitations: string[];
  supporting_excerpt: string | null;
  excerpt_verified: boolean;
  similarity_score: number;
  score_components: Record<string, number>;
  extraction_confidence: string;
  collected_at: string;
};

export type ProjectComparison = {
  id: string;
  run_id: string;
  similar_project_id: string;
  shared_features: string[];
  differences: string[];
  possible_gaps: string[];
  explanation: string;
  supporting_source_ids: string[];
};

export type Stakeholder = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: "suggested" | "confirmed" | "rejected" | string;
  created_by: string;
};

export type StakeholderNeed = {
  id: string;
  stakeholder_id: string;
  need_text: string;
  need_type: string;
  evidence_status: string;
  supporting_count: number;
  contradicting_count: number;
  independent_source_count: number;
  ai_interpretation: string | null;
  missing_information: string[];
  validation_question: string | null;
};

export type Evidence = {
  id: string;
  source_id: string;
  claim_id: string | null;
  need_id: string | null;
  excerpt: string;
  relation: "supports" | "contradicts" | string;
  evidence_type: string;
  excerpt_verified: boolean;
  retrieved_at: string | null;
  source_url: string | null;
  source_title: string | null;
};

export type Opportunity = {
  id: string;
  origin: string;
  description: string;
  rationale: string;
  linked_need_ids: string[];
  linked_project_ids: string[];
  status: string;
};

export type ProjectRequirement = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  requirement_type: string;
  priority: string;
};

export type VerificationResult = {
  test: string;
  result: "pass" | "fail" | "error" | string;
  details: string;
  tested_at?: string;
};

export type ChainRequirement = {
  id: string;
  text: string;
  acceptance_test: string;
  verification: VerificationResult[];
};

export type OpportunityChain = {
  opportunity: { id: string; description: string; rationale: string };
  needs: Array<{ id: string; text: string; evidence_status: string }>;
  evidence: Array<{ id: string; excerpt: string; relation: string; source_url: string | null }>;
  requirements: ChainRequirement[];
};

export type ProjectReportNeed = StakeholderNeed & {
  stakeholder: string;
  linked_solutions: Array<{
    similar_project_id: string;
    relation: string;
    text: string;
    similarity: number;
  }>;
};

export type ProjectReport = {
  legend: Record<string, string>;
  project: Project;
  research_scope: ResearchJob["scope"] | null;
  similar_projects: SimilarProject[];
  comparisons: ProjectComparison[];
  stakeholders: Stakeholder[];
  needs: ProjectReportNeed[];
  stakeholder_scope: ResearchJob["scope"] | null;
  opportunities: Opportunity[];
};

export type HackathonSearchResult = {
  query: string;
  searched_at: string;
  results: Array<{
    id: string;
    name: string;
    url: string;
    snippet: string;
    verification: "unverified" | string;
    source: string;
  }>;
  note: string;
};

export type PriorArtRepository = {
  id: string;
  source: string;
  name: string;
  owner: string;
  description: string;
  url: string;
  language: string;
  topics: string[];
  stars: number | null;
  forks: number | null;
  lastUpdated: string;
  licence: string;
  retrieval: string;
  checkedAt: string;
  limitations: string;
};

export type PriorArtResponse = {
  provider: string;
  retrieval: string;
  query: string;
  checkedAt: string;
  totalCount: number;
  items: PriorArtRepository[];
  limitations: string[];
};

export class ApiError extends Error {
  status: number;
  path: string;

  constructor(status: number, message: string, path: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, timeoutMs = 45_000 } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(localStorage.getItem("buildscope:token") ? { Authorization: `Bearer ${localStorage.getItem("buildscope:token")}` } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail: unknown }).detail)
          : typeof payload === "string" && payload.trim()
            ? payload.trim().slice(0, 300)
            : `The research API returned HTTP ${response.status}.`;
      throw new ApiError(response.status, detail, path);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      if (signal?.aborted) throw error;
      throw new ApiError(
        0,
        "The research API did not respond in time. It may be waking up — try again.",
        path,
      );
    }
    throw new ApiError(
      0,
      "Could not reach the research API. Check the connection and try again.",
      path,
    );
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export const api = {
  login: (email: string, password: string) => request<AuthSession>("/api/auth/login", { method: "POST", body: { email, password }, timeoutMs: 20_000 }),
  register: (email: string, password: string) => request<AuthSession>("/api/auth/register", { method: "POST", body: { email, password }, timeoutMs: 20_000 }),
  me: (signal?: AbortSignal) => request<{ id: string; email: string }>("/api/auth/me", { signal, timeoutMs: 20_000 }),
  health: (signal?: AbortSignal) => request<{ status: string }>("/health", { signal, timeoutMs: 20_000 }),

  listProjects: (signal?: AbortSignal) => request<Project[]>("/api/projects", { signal }),

  getProject: (projectId: string, signal?: AbortSignal) =>
    request<Project>(`/api/projects/${encodeURIComponent(projectId)}`, { signal }),

  createProject: (input: ProjectCreateInput) =>
    request<Project>("/api/projects", { method: "POST", body: input }),

  startResearch: (projectId: string) =>
    request<{ job_id: string; status: string }>(
      `/api/projects/${encodeURIComponent(projectId)}/research`,
      { method: "POST", timeoutMs: 30_000 },
    ),

  startStakeholderAnalysis: (projectId: string) =>
    request<{ job_id: string; status: string }>(
      `/api/projects/${encodeURIComponent(projectId)}/stakeholders/analyze`,
      { method: "POST", timeoutMs: 30_000 },
    ),

  getJob: (jobId: string, signal?: AbortSignal) =>
    request<ResearchJob>(`/api/jobs/${encodeURIComponent(jobId)}`, { signal, timeoutMs: 25_000 }),

  listResearchRuns: (projectId: string, signal?: AbortSignal) =>
    request<ResearchJob[]>(`/api/projects/${encodeURIComponent(projectId)}/research-runs`, { signal }),
  researchProviderStatus: (signal?: AbortSignal) => request<ResearchProviderStatus>("/api/research/provider-status", { signal }),

  listSimilarProjects: (projectId: string, signal?: AbortSignal) =>
    request<SimilarProject[]>(
      `/api/projects/${encodeURIComponent(projectId)}/similar-projects`,
      { signal },
    ),

  listComparisons: (projectId: string, signal?: AbortSignal) =>
    request<ProjectComparison[]>(`/api/projects/${encodeURIComponent(projectId)}/comparisons`, {
      signal,
    }),

  listStakeholders: (projectId: string, signal?: AbortSignal) =>
    request<Stakeholder[]>(`/api/projects/${encodeURIComponent(projectId)}/stakeholders`, {
      signal,
    }),

  identifyStakeholders: (projectId: string) =>
    request<Stakeholder[]>(
      `/api/projects/${encodeURIComponent(projectId)}/stakeholders/identify`,
      { method: "POST", timeoutMs: 90_000 },
    ),

  addStakeholder: (projectId: string, input: { name: string; description: string }) =>
    request<Stakeholder>(`/api/projects/${encodeURIComponent(projectId)}/stakeholders`, {
      method: "POST",
      body: input,
    }),

  updateStakeholder: (
    stakeholderId: string,
    input: { name?: string; description?: string; status?: string },
  ) =>
    request<Stakeholder>(`/api/stakeholders/${encodeURIComponent(stakeholderId)}`, {
      method: "PATCH",
      body: input,
    }),

  listNeeds: (projectId: string, status?: string, signal?: AbortSignal) =>
    request<StakeholderNeed[]>(
      `/api/projects/${encodeURIComponent(projectId)}/needs${queryString({ status })}`,
      { signal },
    ),

  listEvidence: (projectId: string, needId?: string, signal?: AbortSignal) =>
    request<Evidence[]>(
      `/api/projects/${encodeURIComponent(projectId)}/evidence${queryString({ need_id: needId })}`,
      { signal },
    ),

  listOpportunities: (projectId: string, signal?: AbortSignal) =>
    request<Opportunity[]>(`/api/projects/${encodeURIComponent(projectId)}/opportunities`, {
      signal,
    }),

  getReport: (projectId: string, signal?: AbortSignal) =>
    request<ProjectReport>(`/api/projects/${encodeURIComponent(projectId)}/report`, {
      signal,
      timeoutMs: 60_000,
    }),

  listProjectRequirements: (projectId: string, signal?: AbortSignal) =>
    request<ProjectRequirement[]>(
      `/projects/${encodeURIComponent(projectId)}/requirements`,
      { signal },
    ),

  createProjectRequirement: (
    projectId: string,
    input: { title: string; description: string; requirement_type: string; priority: string },
  ) =>
    request<ProjectRequirement>(`/projects/${encodeURIComponent(projectId)}/requirements`, {
      method: "POST",
      body: input,
    }),

  listAllOpportunities: (signal?: AbortSignal) =>
    request<Array<{ id: string; description: string; linked_needs: number }>>("/opportunities", {
      signal,
    }),

  generateRequirement: (opportunityId: string) =>
    request<{ id: string; text: string; acceptance_test: string }>(
      `/opportunities/${encodeURIComponent(opportunityId)}/requirement`,
      { method: "POST", timeoutMs: 120_000 },
    ),

  verifyRequirement: (requirementId: string) =>
    request<VerificationResult[]>(
      `/requirements/${encodeURIComponent(requirementId)}/verify`,
      { method: "POST", timeoutMs: 120_000 },
    ),

  getChain: (opportunityId: string, signal?: AbortSignal) =>
    request<OpportunityChain>(`/opportunities/${encodeURIComponent(opportunityId)}/chain`, {
      signal,
    }),

  searchHackathons: (query: string, limit = 12, signal?: AbortSignal) =>
    request<HackathonSearchResult>(
      `/api/hackathons/search${queryString({ query, limit })}`,
      { signal, timeoutMs: 60_000 },
    ),

  searchPriorArt: (query: string, limit = 10, signal?: AbortSignal) =>
    request<PriorArtResponse>("/api/prior-art/repositories", {
      method: "POST",
      body: { query, limit },
      signal,
      timeoutMs: 60_000,
    }),
};
