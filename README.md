# BuildScope AI — FastAPI-powered frontend

BuildScope is an evidence-led investigation workspace that helps students and builders decide what is worth building before they commit to implementation.

## Architecture

```
React 19 + TypeScript + Vite
        │ REST / JSON
        ▼
Buildscope_Backend (FastAPI)
        ├── TinyFish live web search
        ├── LLM + embeddings research pipeline
        ├── SQLAlchemy persistence
        ├── Similar-project and comparison analysis
        ├── Stakeholder needs and opportunity discovery
        └── Requirements and verification chains
```

FastAPI is the source of truth for project records, research jobs, reports, opportunities, and requirements. Convex and Convex Auth have been removed from the frontend runtime and direct dependencies. There is no parallel frontend database.

## Product journey

- **Discover** — Hackathon Radar searches live web leads through the backend. Results are explicitly unverified until confirmed with the organiser.
- **Investigate** — Create a project and run the asynchronous research pipeline.
- **Understand** — Review comparable projects, source excerpts, comparisons, stakeholder needs, and opportunity hypotheses.
- **Prove** — The Buildability Passport assembles a project-specific record from the backend report. It distinguishes retrieved material from AI interpretations and hypotheses; it is not a legal novelty or patentability certificate.
- **Build** — Use validated opportunities as the basis for requirements and acceptance tests.

## Run locally

1. Start the FastAPI backend from [Buildscope_Backend](https://github.com/avnipahal624/Buildscope_Backend) and confirm `GET /health` returns `{"status":"ok"}`.
2. Install frontend dependencies with `bun install` (or `npm install`).
3. Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Run `bun run dev` (or `npm run dev`).

For deployment, set `VITE_API_BASE_URL` to the deployed FastAPI origin and set `FRONTEND_ORIGIN` on the backend to the exact frontend origin. The backend permits localhost:5173 for development. Provide the backend with its database, TinyFish and LLM credentials through backend-only environment variables; never put these keys in Vite. Deploy the backend branch `feat/fastapi-buildability-passport` before using this frontend branch.

## Important backend constraints

- Research and stakeholder analysis are background jobs. The UI polls `GET /api/jobs/{job_id}` and should handle pending, running, completed, completed_with_errors, and failed states.
- Hackathon search returns unverified leads, not confirmed registrations or deadlines.
- Prior-art repository search is a GitHub repository search, not a patent database or legal novelty opinion.
- User authentication and per-user project ownership must be implemented and enforced by the backend before exposing private student work to multiple users. The frontend does not pretend that an unauthenticated API is secure.
- Roadmaps, saved opportunities, profile management, and longitudinal progress are not claimed as implemented by the current FastAPI API unless corresponding endpoints are added.

## Buildability Passport

The Passport is a structured view over the backend project report, the dedicated evidence endpoint, and persisted opportunity proof chains. The Print / Save PDF button invokes the browser print dialog with a dedicated print stylesheet. It surfaces comparable work, evidence, inferred needs, and opportunities with a clear review checklist. It deliberately avoids inventing a readiness score: missing evidence remains missing, and human validation is explicit.

## Environment

- `VITE_API_BASE_URL` — defaults to `http://localhost:8000`.
