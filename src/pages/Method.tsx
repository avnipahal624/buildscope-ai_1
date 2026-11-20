import { API_BASE_LABEL, api } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import {
  BookOpenCheck,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  Github,
  KeyRound,
  Layers3,
  Server,
  ShieldCheck,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";
import {
  InfoNote,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";
import { CompassOrb } from "@/components/decor/Scenes";

const ENDPOINTS = [
  { method: "GET", path: "/api/hackathons/search", use: "Live TinyFish hackathon leads" },
  { method: "GET", path: "/api/projects", use: "List research projects" },
  { method: "POST", path: "/api/projects", use: "Create a project" },
  { method: "GET", path: "/api/projects/{id}", use: "Project identity" },
  { method: "POST", path: "/api/projects/{id}/research", use: "Start a background research job" },
  { method: "GET", path: "/api/jobs/{id}", use: "Poll job status, scope, warnings and errors" },
  { method: "GET", path: "/api/projects/{id}/similar-projects", use: "Comparable public projects" },
  { method: "GET", path: "/api/projects/{id}/comparisons", use: "Shared features, differences, gaps" },
  { method: "POST", path: "/api/projects/{id}/stakeholders/identify", use: "AI-suggested stakeholder groups" },
  { method: "POST", path: "/api/projects/{id}/stakeholders/analyze", use: "Background stakeholder evidence job" },
  { method: "GET", path: "/api/projects/{id}/needs", use: "Needs with evidence status" },
  { method: "GET", path: "/api/projects/{id}/evidence", use: "Evidence ledger with source provenance" },
  { method: "GET", path: "/api/projects/{id}/opportunities", use: "Opportunity hypotheses" },
  { method: "GET", path: "/api/projects/{id}/report", use: "Combined research report" },
  { method: "POST", path: "/api/prior-art/repositories", use: "Live public GitHub repository search" },
  { method: "POST", path: "/projects/{id}/requirements", use: "Save a project requirement" },
  { method: "POST", path: "/opportunities/{id}/requirement", use: "Generate a proof-chain requirement" },
  { method: "GET", path: "/opportunities/{id}/chain", use: "Opportunity → requirement → verification" },
  { method: "POST", path: "/requirements/{id}/verify", use: "Run requirement verification" },
  { method: "GET", path: "/api/projects/{id}/stakeholders", use: "List stakeholder groups" },
  { method: "PATCH", path: "/api/stakeholders/{id}", use: "Confirm or reject a stakeholder group" },
];

export default function Method() {
  const health = useResource((signal) => api.health(signal), []);
  const online = health.data?.status === "ok" && !health.error;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Method & limits"
        title={
          <>
            Evidence first.
            <br />
            <span className="italic text-forest/60">Honest about the rest.</span>
          </>
        }
        description="BuildScope is a research workspace, not an originality certificate. This page documents what the existing FastAPI backend supports, how sourced facts are separated from interpretation, and which product modules are deliberately not simulated."
        actions={
          <>
            <Tag tone={online ? "sage" : "peach"}>
              <Server className="mr-1 size-3" aria-hidden />
              {health.loading ? "Checking API" : online ? "API connected" : "API unavailable"}
            </Tag>
            <Tag tone="cream">
              <Database className="mr-1 size-3" aria-hidden /> Existing FastAPI service
            </Tag>
          </>
        }
        aside={<CompassOrb className="hidden h-[150px] w-[150px] lg:block" value={0} />}
      />

      <InfoNote tone="peach">
        <span>
          <strong className="font-semibold">No parallel backend.</strong> The React app calls the
          existing FastAPI service through one typed client. The development preview uses a Vite
          proxy because the deployed backend allows only its configured frontend origin.
        </span>
      </InfoNote>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Architecture" icon={Layers3}>
          <ol className="space-y-2 text-[0.78rem] leading-6 text-charcoal/70">
            {[
              "React + TypeScript + Vite interface with an editorial workspace shell.",
              "One centralized API client (src/lib/api.ts) with typed contracts and explicit errors.",
              "Existing FastAPI service, including its research and stakeholder pipelines.",
              "SQLAlchemy database, TinyFish web search/retrieval, configuration-driven LLM and embeddings.",
            ].map((item, index) => (
              <li key={item} className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream text-[0.62rem] font-semibold text-forest">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-forest px-4 py-3 text-ivory">
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-ivory/45">API base</p>
            <p className="mt-1 break-words text-[0.72rem] text-ivory/80">{API_BASE_LABEL}</p>
            <p className="mt-2 text-[0.62rem] leading-4 text-ivory/50">
              Configured with VITE_API_BASE_URL. In development, requests go through the Vite
              `/backend` proxy to BUILDSCOPE_API_TARGET.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="https://buildscope-backend.onrender.com/docs" label="Open FastAPI docs" />
            <ButtonLink href="https://github.com/avnipahal624/Buildscope_Backend" label="Backend repository" />
          </div>
        </SectionCard>

        <SectionCard title="What is supported" icon={CheckCircle2}>
          <ul className="space-y-2 text-[0.74rem] leading-5 text-charcoal/70">
            {[
              "Live hackathon lead search with original URLs and unverified labels.",
              "Project creation, listing and research job monitoring.",
              "Comparable projects, comparisons, evidence excerpts and opportunity hypotheses.",
              "Stakeholder identification, confirmation and evidence-backed need analysis.",
              "Project requirements, proof-chain requirement generation and verification.",
              "Live public GitHub repository metadata for prior-art discovery.",
              "A generated Buildability Passport with printable/exportable output.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-forest/50" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Evidence model" icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Sourced facts",
              tone: "bg-sage/50",
              icon: FileSearch,
              body: "Retrieved page excerpts, source URLs, comparable-project fields and repository metadata. Source text is stored separately from AI interpretation.",
            },
            {
              title: "AI interpretations",
              tone: "bg-lavender/40",
              icon: Layers3,
              body: "Need interpretations, comparison explanations and extracted project details. They are reviewable outputs, not independent proof.",
            },
            {
              title: "Hypotheses",
              tone: "bg-peach/40",
              icon: TriangleAlert,
              body: "Opportunities and possible gaps. They describe what deserves further research, never a guaranteed unmet need.",
            },
          ].map((item) => (
            <div key={item.title} className={`rounded-xl p-3.5 ${item.tone}`}>
              <item.icon className="size-4 text-forest/60" aria-hidden />
              <p className="mt-2 font-display text-lg text-forest">{item.title}</p>
              <p className="mt-1 text-[0.68rem] leading-5 text-forest/65">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-cream/60 px-3 py-2 text-[0.65rem] leading-5 text-forest/60">
          An excerpt found in a retrieved page does not independently prove the full claim. A
          similarity signal does not prove that two ideas are equivalent or that a project is not novel.
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Not supported in this backend version" icon={XCircle}>
          <ul className="space-y-2 text-[0.72rem] leading-5 text-charcoal/70">
            {[
              "Accounts, authentication and per-user ownership. The workspace is shared and labelled as such.",
              "Student profiles, skill profiles and learning roadmaps.",
              "Project milestones, task completion and preparation scores.",
              "Saved opportunities, notifications and a persistent research library.",
              "Project editing and deletion: the API exposes create, list and read only.",
              "Aggregate verification history: results are read per opportunity proof chain.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <InfoNote tone="cream" className="mt-3">
            These modules are absent rather than stored in browser storage or faked with local demo
            data. Adding them requires backend models, endpoints and deployment.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Environment & operations" icon={KeyRound}>
          <div className="space-y-2 text-[0.7rem] leading-5">
            {[
              { key: "VITE_API_BASE_URL", body: "Frontend base URL for the FastAPI service in a deployed build." },
              { key: "BUILDSCOPE_API_TARGET", body: "Development proxy target. Defaults to the deployed Render service." },
              { key: "TINYFISH_API_KEY", body: "Backend-only credential for live search and page retrieval." },
              { key: "LLM_API_KEY / LLM_BASE_URL / LLM_MODEL", body: "Backend extraction and analysis configuration." },
              { key: "EMBEDDING_*", body: "Backend similarity and need-clustering configuration." },
              { key: "GITHUB_TOKEN", body: "Optional backend token for higher prior-art rate limits." },
            ].map((item) => (
              <div key={item.key} className="rounded-lg border border-border/60 bg-cream/25 px-3 py-2">
                <code className="text-[0.65rem] font-semibold text-forest">{item.key}</code>
                <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.62rem] leading-4 text-muted-foreground">
            No provider key is placed in frontend code. Secrets belong in the backend environment.
            A production frontend origin must be added to the backend CORS allow-list.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Endpoint map" icon={Database} eyebrow="Implemented against the existing service">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[0.66rem]">
            <thead>
              <tr className="border-b border-border/70 text-[0.58rem] uppercase tracking-[0.08em] text-forest/45">
                <th className="py-2 pr-3 font-semibold">Method</th>
                <th className="py-2 pr-3 font-semibold">Path</th>
                <th className="py-2 font-semibold">Used for</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`} className="border-b border-border/40 last:border-0">
                  <td className="py-1.5 pr-3">
                    <span className={`rounded-full px-1.5 py-0.5 text-[0.52rem] font-semibold ${
                      endpoint.method === "GET" ? "bg-sage/60 text-forest" : endpoint.method === "PATCH" ? "bg-gold/40 text-forest" : "bg-lavender/60 text-forest"
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 font-mono text-[0.62rem] text-forest/75">{endpoint.path}</td>
                  <td className="py-1.5 text-muted-foreground">{endpoint.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Research limitations" icon={TriangleAlert}>
        <ul className="space-y-2 text-[0.72rem] leading-5 text-charcoal/70">
          {[
            "Live provider availability, source coverage, rate limits and model behaviour limit what research can find.",
            "Background jobs are not resumable after a server restart; the backend marks interrupted runs as failed.",
            "Evidence status describes retrieved source strength, not the prevalence of a need or market demand.",
            "Domain independence is approximate and may not detect republished material.",
            "Similarity weights and thresholds need evaluation against labelled examples.",
            "Verification is a requirement/evidence check, not proof of product success.",
            "This platform does not provide patent, trademark, legal or freedom-to-operate advice.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="flex flex-wrap items-center justify-center gap-2 pb-2 text-[0.65rem] text-muted-foreground">
        <Github className="size-3.5" aria-hidden />
        Built on the existing FastAPI research pipeline.
        <Users className="ml-2 size-3.5" aria-hidden />
        <BookOpenCheck className="size-3.5" aria-hidden />
        <a href="https://github.com/avnipahal624/Buildscope_Backend" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-forest">
          Inspect the backend <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-card px-3 py-1.5 text-[0.65rem] text-forest transition-colors hover:bg-cream"
    >
      {label} <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}
