const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } }); }
  catch { throw new ApiError("Could not reach BuildScope API. Check VITE_API_BASE_URL and that the backend is running.", 0); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(typeof body.detail === "string" ? body.detail : Array.isArray(body.detail) ? body.detail.map((issue: {msg?:string}) => issue.msg || "Invalid field").join("; ") : body.message || `Request failed (${response.status})`, response.status);
  return body as T;
}

export const api = {
  health: () => request<{status:string}>("/health"),
  projects: () => request<any[]>("/api/projects"),
  project: (id: string) => request<any>(`/api/projects/${id}`),
  createProject: (payload: {name:string;description:string;problem_statement:string;target_users:string[];keywords:string[];planned_features:string[]}) =>
    request<any>("/api/projects", { method:"POST", body:JSON.stringify(payload) }),
  startResearch: (id:string) => request<{job_id:string;status:string}>(`/api/projects/${id}/research`, {method:"POST",body:"{}"}),
  startStakeholderAnalysis: (id:string) => request<{job_id:string;status:string}>(`/api/projects/${id}/stakeholders/analyze`, {method:"POST",body:"{}"}),
  job: (id:string) => request<any>(`/api/jobs/${id}`),
  report: (id:string) => request<any>(`/api/projects/${id}/report`),
  evidence: (id:string) => request<any[]>(`/api/projects/${id}/evidence`),
  needs: (id:string) => request<any[]>(`/api/projects/${id}/needs`),
  stakeholders: (id:string) => request<any[]>(`/api/projects/${id}/stakeholders`),
  identifyStakeholders: (id:string) => request<any[]>(`/api/projects/${id}/stakeholders/identify`,{method:"POST"}),
  addStakeholder: (id:string,name:string,description:string) => request<any>(`/api/projects/${id}/stakeholders`,{method:"POST",body:JSON.stringify({name,description})}),
  confirmStakeholder: (id:string) => request<any>(`/api/stakeholders/${id}`,{method:"PATCH",body:JSON.stringify({status:"confirmed"})}),
  similar: (id:string) => request<any[]>(`/api/projects/${id}/similar-projects`),
  comparisons: (id:string) => request<any[]>(`/api/projects/${id}/comparisons`),
  opportunities: (id:string) => request<any[]>(`/api/projects/${id}/opportunities`),
  requirements: (id:string) => request<any[]>(`/projects/${id}/requirements`),
  createRequirement: (id:string,payload:any) => request<any>(`/projects/${id}/requirements`,{method:"POST",body:JSON.stringify(payload)}),
  generateOpportunityRequirement: (id:string) => request<any>(`/opportunities/${id}/requirement`,{method:"POST"}),
  verifyRequirement: (id:string) => request<any>(`/requirements/${id}/verify`,{method:"POST"}),
  opportunityChain: (id:string) => request<any>(`/opportunities/${id}/chain`),
  hackathons: (query:string) => request<{results:any[];searched_at:string}>(`/api/hackathons/search?query=${encodeURIComponent(query)}`),
  priorArt: (query:string,limit=10) => request<any>("/api/prior-art/repositories",{method:"POST",body:JSON.stringify({query,limit})}),
};
export { API_BASE };
