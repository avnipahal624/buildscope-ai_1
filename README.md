# BuildScope AI

**Evidence-driven student innovation and project investigation.**

BuildScope helps a student answer: *Is this idea worth building, what already exists, what is missing, and how can I prove that my solution works?*

The app is a React + TypeScript + Vite workspace backed by the **existing FastAPI research service** at `https://buildscope-backend.onrender.com`. Convex, Convex Auth and the previous local demonstration catalogue have been removed.

> BuildScope is a research aid, not an originality, patentability or legal certificate. It is also not a guarantee of product-market fit.

## What works

- **Overview** — a command centre built from real projects, research reports, evidence and requirements.
- **Hackathon Radar** — live `GET /api/hackathons/search` via the backend's TinyFish integration. Results are explicitly labelled unverified and link to the original source. Deadlines, prizes and eligibility are never invented.
- **Projects** — create and read real project records through the FastAPI service.
- **Project workspace** — background research jobs, comparable projects, comparisons, evidence, stakeholder groups, needs, opportunities, requirements and verification.
- **Prior Art Lab** — live public GitHub repository metadata through `POST /api/prior-art/repositories`. It is not a patent database or code-similarity verdict.
- **Buildability Passport** — a structured, dated report generated from the project's actual records, with a readiness checklist (complete / partial / missing / not assessed), evidence ledger, requirements, verification and next steps. Print to PDF or download Markdown.
- **Research Progress** — coverage and a timeline derived from real records; verification history is read on demand from each opportunity's proof chain.
- **Method & Limits** — a plain-language account of the architecture, supported endpoints, data separation and unsupported modules.

## Architecture

```text
React + TypeScript + Vite
        │
        ▼
Centralized typed API client (src/lib/api.ts)
        │
        ▼
Existing FastAPI backend
        │
        ▼
SQLAlchemy database, TinyFish, LLM, embeddings and research pipelines
```

There is no parallel backend and no browser-storage substitute for application data.

- Frontend routes are in `src/main.tsx`.
- The API contract and error handling live in `src/lib/api.ts`.
- Async resource and job polling hooks live in `src/hooks/use-resource.ts`.
- Passport derivation and Markdown export live in `src/lib/passport.ts`.
- Shared research UI lives in `src/components/research.tsx`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend build | Base URL of the FastAPI service. Leave blank in development to use the dev proxy. |
| `BUILDSCOPE_API_TARGET` | Vite dev server | Development proxy target. Defaults to the deployed Render backend. |
| `TINYFISH_API_KEY` | Backend only | Live web search and page retrieval. |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | Backend only | Extraction and analysis. |
| `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL` | Backend only | Similarity and need clustering. |
| `GITHUB_TOKEN` | Backend only (optional) | Higher GitHub search rate limits. |

No provider credential is read by frontend code.

### CORS and the development proxy

The deployed FastAPI service allow-lists its configured Vercel frontend origin. A preview hosted on another origin cannot call it directly from the browser. `vite.config.ts` therefore proxies `/backend/*` to `BUILDSCOPE_API_TARGET` and strips the prefix. This is a development transport concern, not a second backend.

In a deployed build, set `VITE_API_BASE_URL` to the FastAPI origin **and add that frontend origin to the backend's CORS allow-list**. Otherwise the browser will block requests.

## Setup

```bash
bun install
bun run dev
```

The platform manages the preview server. Do not start a second dev server in this environment.

### Verification

```bash
bun tsc -b --noEmit
```

There are no frontend unit tests in this repository yet. The FastAPI repository contains its own pytest suite and documentation at `https://buildscope-backend.onrender.com/docs`.

## API endpoints used

| Method | Path | Use |
|---|---|---|
| `GET` | `/api/hackathons/search` | Live hackathon leads |
| `GET` / `POST` | `/api/projects` | List and create projects |
| `GET` | `/api/projects/{id}` | Project identity |
| `POST` | `/api/projects/{id}/research` | Start a research job |
| `GET` | `/api/jobs/{id}` | Poll job status, warnings and errors |
| `GET` | `/api/projects/{id}/similar-projects` | Comparable public projects |
| `GET` | `/api/projects/{id}/comparisons` | Shared features, differences and gaps |
| `POST` | `/api/projects/{id}/stakeholders/identify` | AI-suggested stakeholder groups |
| `POST` / `GET` | `/api/projects/{id}/stakeholders` | Add / list stakeholder groups |
| `PATCH` | `/api/stakeholders/{id}` | Confirm or reject a group |
| `POST` | `/api/projects/{id}/stakeholders/analyze` | Stakeholder evidence job |
| `GET` | `/api/projects/{id}/needs` | Evidence-backed needs |
| `GET` | `/api/projects/{id}/evidence` | Evidence ledger |
| `GET` | `/api/projects/{id}/opportunities` | Opportunity hypotheses |
| `GET` | `/api/projects/{id}/report` | Combined report |
| `POST` | `/api/prior-art/repositories` | Live GitHub prior-art search |
| `GET` / `POST` | `/projects/{id}/requirements` | Project requirements |
| `POST` | `/opportunities/{id}/requirement` | Generate a proof-chain requirement |
| `GET` | `/opportunities/{id}/chain` | Full proof chain |
| `POST` | `/requirements/{id}/verify` | Run verification |

## Evidence model

BuildScope preserves the backend's separation between:

1. **Sourced facts** — retrieved excerpts, source URLs, comparable-project fields and public repository metadata.
2. **AI interpretations** — extraction, need interpretation and comparison explanation.
3. **Hypotheses** — opportunities and possible gaps that require further research.

An excerpt found in a page does not independently prove the full claim. Similarity signals are prioritisation aids, not originality proof. Missing evidence and unavailable checks are shown as missing or not assessed.

## Known backend limitations

The deployed FastAPI version does **not** provide:

- authentication or per-user ownership (the workspace is shared and labelled as such);
- student profiles, skill profiles or learning roadmaps;
- project milestones, task tracking or preparation scores;
- saved opportunities, notifications or a persistent research library;
- project update/delete endpoints (the API supports create, list and read);
- an aggregate verification history endpoint (results are read per proof chain).

These modules are **not** simulated in the frontend. Adding them requires backend models, endpoints, migrations and deployment.

## Notes

- Background jobs are not resumable after a server restart; the backend marks interrupted runs as failed.
- Provider availability, source coverage, rate limits and model behaviour limit research quality.
- This platform does not provide patent, trademark, legal or freedom-to-operate advice.
