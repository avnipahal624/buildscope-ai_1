const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
export class BackendError extends Error {}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); }
  catch { throw new BackendError('BuildScope API is unavailable.'); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new BackendError(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`);
  return body as T;
}
export const backend = {
  projects: () => request<any[]>('/api/projects'),
  report: (id: string) => request<any>(`/api/projects/${id}/report`),
  evidence: (id: string) => request<any[]>(`/api/projects/${id}/evidence`),
  opportunities: (id: string) => request<any[]>(`/api/projects/${id}/opportunities`),
  similar: (id: string) => request<any[]>(`/api/projects/${id}/similar-projects`),
  startResearch: (id: string) => request<{job_id:string;status:string}>(`/api/projects/${id}/research`, {method:'POST',body:'{}'}),
};
export { API_BASE };
