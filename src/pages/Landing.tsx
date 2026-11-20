import { useLightTheme } from "@/hooks/use-light-theme";
import { api } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  Database,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Github,
  Layers3,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router";
import {
  ArchScene,
  BookScene,
  CompassOrb,
  CompassStar,
  LaptopScene,
  Tilt,
} from "@/components/decor/Scenes";
import { Button } from "@/components/ui/button";
import { InfoNote, StatusPill, Tag } from "@/components/common";

const JOURNEY = [
  {
    id: "01",
    title: "Discover",
    icon: Radar,
    tone: "bg-sage",
    body: "Search the live web for hackathons and public opportunities. Results are leads with their original source, never invented deadlines or prizes.",
    detail: ["Live TinyFish search", "Original source links", "Unverified labels"],
  },
  {
    id: "02",
    title: "Investigate",
    icon: FileSearch,
    tone: "bg-peach",
    body: "Turn an idea into a research run: queries, retrieved pages, comparable projects, evidence excerpts and comparisons.",
    detail: ["Background research jobs", "Comparable projects", "Evidence excerpts"],
  },
  {
    id: "03",
    title: "Validate",
    icon: Target,
    tone: "bg-lavender",
    body: "Identify stakeholder groups and analyse publicly evidenced needs with supporting and contradicting sources.",
    detail: ["Stakeholder analysis", "Need evidence status", "Validation questions"],
  },
  {
    id: "04",
    title: "Build",
    icon: Layers3,
    tone: "bg-[#F0E3C8]",
    body: "Turn opportunities into reviewable requirements with acceptance tests. A requirement is a claim until it is verified.",
    detail: ["Proof-chain requirements", "Acceptance tests", "Verification runs"],
  },
  {
    id: "05",
    title: "Prove",
    icon: FileCheck2,
    tone: "bg-cream",
    body: "Generate a Buildability Passport that states what is supported, what is missing and what still needs research.",
    detail: ["Evidence ledger", "Readiness checklist", "Printable report"],
  },
];

export default function Landing() {
  useLightTheme();
  const health = useResource((signal) => api.health(signal), []);
  const apiOnline = health.data?.status === "ok" && !health.error;

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="BuildScope home" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-forest">
              <CompassStar className="size-5 text-gold" />
            </span>
            <span>
              <span className="block font-display text-xl leading-none text-forest">BuildScope</span>
              <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.2em] text-forest/50">
                Discover. Investigate. Prove.
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-forest/70 md:flex" aria-label="Primary">
            <a href="#journey" className="transition-colors hover:text-forest">The journey</a>
            <a href="#radar" className="transition-colors hover:text-forest">Radar</a>
            <a href="#evidence" className="transition-colors hover:text-forest">Evidence</a>
            <a href="#passport" className="transition-colors hover:text-forest">Passport</a>
            <Link to="/method" className="transition-colors hover:text-forest">Limits</Link>
          </nav>

          <Button asChild className="rounded-full bg-forest text-ivory hover:bg-forest-deep">
            <Link to="/dashboard">
              Open workspace
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 top-10 size-[420px] rounded-full bg-sage/40 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute right-0 top-24 size-[360px] rounded-full bg-peach/30 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-[1220px] gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-6 lg:pb-20 lg:pt-16">
            <div>
              <p className="label-caps inline-flex items-center gap-2 rounded-full border border-forest/15 bg-cream px-3 py-1.5 text-forest/70">
                <Sparkles className="size-3.5 text-gold" aria-hidden />
                Evidence-driven student innovation
              </p>
              <h1 className="mt-5 font-display text-[2.8rem] leading-[0.98] tracking-[-0.02em] text-forest sm:text-[3.5rem] lg:text-[4rem]">
                Is your idea
                <br />
                <span className="text-forest/55 italic">worth building?</span>
                <br />
                Find out before you build.
              </h1>
              <p className="mt-6 max-w-lg text-[0.98rem] leading-7 text-charcoal/70">
                BuildScope investigates what already exists, what public evidence says users need,
                and whether your requirements can be proven. It turns an idea into a traceable
                research record — not another motivational dashboard.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-forest px-6 text-ivory hover:bg-forest-deep">
                  <Link to="/dashboard">
                    Start investigating
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <a
                  href="#journey"
                  className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-5 py-3 text-sm text-forest transition-colors hover:bg-cream"
                >
                  <ShieldCheck className="size-4" aria-hidden />
                  See the method
                </a>
              </div>
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs text-forest/65">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Backend</dt>
                  <dd>Existing FastAPI research backend</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Prior art</dt>
                  <dd>Live public GitHub metadata</dd>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Evidence</dt>
                  <dd>Sources separated from interpretation</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="stage-wide relative overflow-hidden rounded-[32px] border border-border/70 bg-cream/70 p-2 shadow-[0_40px_80px_-60px_rgba(16,44,35,0.55)]">
                <ArchScene className="aspect-[1.35/1] w-full rounded-[26px]" />
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="rounded-2xl border border-forest/10 bg-ivory/95 px-4 py-3 shadow-float">
                    <p className="label-caps text-forest/50">Research service</p>
                    <p className={cn("mt-1 flex items-center gap-1.5 font-display text-xl leading-none", apiOnline ? "text-forest" : "text-forest/50")}>
                      <span className={cn("size-2 rounded-full", health.loading ? "bg-gold" : apiOnline ? "bg-sage-deep" : "bg-peach-deep")} aria-hidden />
                      {health.loading ? "Checking…" : apiOnline ? "Live" : "Unavailable"}
                    </p>
                    <p className="mt-1.5 max-w-[210px] text-[0.62rem] leading-4 text-charcoal/60">
                      Projects, research jobs and evidence are read from the deployed API.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-forest/10 bg-forest px-4 py-3 text-ivory shadow-float sm:block">
                    <p className="label-caps text-ivory/50">Next move</p>
                    <p className="mt-1 max-w-[170px] text-xs leading-5">
                      Investigate one comparable project before writing a requirement.
                    </p>
                  </div>
                </div>
              </div>
              <div className="float-y-slow absolute -bottom-6 -left-3 hidden w-[186px] rounded-2xl border border-forest/10 bg-card p-3 shadow-float sm:block">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-sage">
                    <Search className="size-4 text-forest" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">Radar</p>
                    <p className="text-xs font-semibold text-forest">Original sources only</p>
                  </div>
                </div>
                <p className="mt-2 text-[0.65rem] leading-4 text-muted-foreground">
                  Every listing links out. Nothing is presented as verified until you check it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="journey" className="mx-auto max-w-[1220px] px-4 pb-16 sm:px-6">
          <div className="flex flex-col justify-between gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:items-end">
            <p className="label-caps text-forest/45">The BuildScope journey</p>
            <p className="max-w-md text-sm leading-6 text-charcoal/60">
              Five stages, one traceable record. Research outputs stay connected to their source,
              their job status and the requirement they support.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {JOURNEY.map((stage) => (
              <Tilt key={stage.id} className="h-full">
                <article
                  className={cn(
                    "flex h-full flex-col rounded-2xl border border-forest/10 p-5 shadow-[0_20px_50px_-44px_rgba(16,44,35,0.6)]",
                    stage.tone,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-full bg-ivory/80 text-forest shadow-sm">
                      <stage.icon className="size-[1.15rem]" aria-hidden />
                    </span>
                    <span className="tnum font-display text-xl text-forest/30">{stage.id}</span>
                  </div>
                  <h2 className="mt-5 font-display text-2xl text-forest">{stage.title}</h2>
                  <p className="mt-2 text-[0.78rem] leading-6 text-charcoal/70">{stage.body}</p>
                  <ul className="mt-4 space-y-1.5 text-[0.68rem] text-forest/65">
                    {stage.detail.map((item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-forest/40" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Tilt>
            ))}
          </div>
        </section>

        <section id="radar" className="border-y border-forest/10 bg-cream/60">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="label-caps text-forest/45">Hackathon Radar</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl">
                Leads, not promises.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-charcoal/65">
                The radar calls the backend's live TinyFish search and shows the organiser's URL,
                the retrieved snippet and the retrieval time. Deadlines, eligibility and prizes are
                not invented. You confirm them at the source.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-charcoal/70">
                {[
                  "Search by theme, domain or technology.",
                  "Every result is labelled unverified.",
                  "Open the original page before trusting a date.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-sage text-forest">
                      <CheckCircle2 className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 rounded-full border-forest/25 text-forest hover:bg-ivory">
                <Link to="/radar">
                  Search the live radar <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <Tilt strength={5}>
              <div className="rounded-[28px] border border-forest/10 bg-ivory p-4 shadow-[0_40px_80px_-64px_rgba(16,44,35,0.6)] sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-forest/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-forest">
                      <Compass className="size-4 text-gold" aria-hidden />
                    </span>
                    <div>
                      <p className="font-display text-lg leading-none text-forest">Live search</p>
                      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-forest/45">
                        TinyFish · unverified leads
                      </p>
                    </div>
                  </div>
                  <Tag tone="peach">Source required</Tag>
                </div>
                <div className="mt-4 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
                    <Search className="size-3.5" aria-hidden />
                    climate hackathon · university students
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { title: "Retrieved listing", body: "Title, organiser URL and snippet from the live result.", tone: "bg-sage/50" },
                      { title: "Retrieval context", body: "Search time and provider limits stay visible.", tone: "bg-cream" },
                      { title: "Open original", body: "Deadlines and eligibility are confirmed at the source.", tone: "bg-peach/50" },
                    ].map((row) => (
                      <div key={row.title} className={cn("flex items-start gap-2.5 rounded-xl px-3 py-2.5", row.tone)}>
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-forest/50" aria-hidden />
                        <div>
                          <p className="text-[0.72rem] font-semibold text-forest">{row.title}</p>
                          <p className="mt-0.5 text-[0.64rem] leading-4 text-charcoal/60">{row.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 rounded-lg bg-cream/80 px-3 py-2 text-[0.65rem] leading-5 text-forest/60">
                  This panel explains the result structure. It does not display fabricated listings.
                </p>
              </div>
            </Tilt>
          </div>
        </section>

        <section id="evidence" className="bg-forest text-ivory">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="label-caps text-gold/80">Evidence, not assertions</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-[2.6rem]">
                Every finding keeps its receipt.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-ivory/70">
                A research job records its status, queries, warnings and usage. Extracted excerpts
                are stored separately from AI interpretation. Unlike a similarity percentage, an
                excerpt can be opened and checked.
              </p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  { icon: Database, title: "Real job states", body: "Pending, running, completed with errors, or failed." },
                  { icon: ShieldCheck, title: "Traceable excerpts", body: "Source URL, retrieval date and verification flag." },
                  { icon: FileSearch, title: "Comparable projects", body: "Public metadata, features and limitations." },
                  { icon: TriangleAlert, title: "Honest gaps", body: "Missing evidence is labelled, never filled in." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-ivory/10 bg-forest-deep/50 p-3.5">
                    <item.icon className="size-4 text-gold" aria-hidden />
                    <p className="mt-2 text-xs font-semibold text-ivory">{item.title}</p>
                    <p className="mt-1 text-[0.68rem] leading-5 text-ivory/60">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Supported", "Strongly supported", "Conflicting", "Unverified"].map((status) => (
                  <span
                    key={status}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em]",
                      status === "Supported" && "bg-sage text-forest",
                      status === "Strongly supported" && "bg-gold/90 text-[#3B2E12]",
                      status === "Conflicting" && "bg-peach text-[#5E3326]",
                      status === "Unverified" && "bg-ivory/15 text-ivory/70",
                    )}
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute inset-x-8 top-10 h-[240px] rounded-[40px] border border-ivory/10" aria-hidden />
              <div className="relative">
                <LaptopScene className="scale-[1.15]" />
                <div className="float-y absolute -left-4 top-2 w-[200px] rounded-xl border border-ivory/15 bg-forest-deep/90 p-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.14em] text-ivory/45">Evidence ledger</p>
                  <p className="mt-1 truncate text-xs font-semibold text-ivory">Source excerpt</p>
                  <div className="mt-2 space-y-1.5 text-[0.6rem] text-ivory/60">
                    <p className="flex justify-between"><span>Source URL</span><span className="text-sage">recorded</span></p>
                    <p className="flex justify-between"><span>Relation</span><span className="text-ivory">supports</span></p>
                    <p className="flex justify-between"><span>Excerpt verified</span><span className="text-ivory">yes / no</span></p>
                  </div>
                  <div className="mt-2">
                    <StatusPill status="Not assessed" className="bg-ivory/15 text-ivory/75" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="passport" className="mx-auto max-w-[1220px] px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative flex justify-center">
              <div className="stage grid place-items-center">
                <CompassOrb className="size-[300px]" value={0} />
              </div>
              <div className="absolute bottom-2 right-2 hidden w-[230px] rounded-2xl border border-forest/10 bg-card p-4 shadow-float sm:block">
                <p className="label-caps text-forest/45">Buildability Passport</p>
                <p className="mt-1 font-display text-lg leading-tight text-forest">
                  A dossier of what you can prove
                </p>
                <ul className="mt-2 space-y-1 text-[0.65rem] text-muted-foreground">
                  <li>✓ Project identity</li>
                  <li>✓ Landscape & evidence ledger</li>
                  <li>✓ Needs, requirements & verification</li>
                  <li>✓ Outstanding questions</li>
                </ul>
                <p className="mt-2 rounded-lg bg-cream/70 px-2 py-1.5 text-[0.58rem] leading-4 text-forest/55">
                  Structure example only — no invented readiness score.
                </p>
              </div>
            </div>
            <div>
              <p className="label-caps text-forest/45">Buildability Passport</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl">
                Readiness is a checklist, not a percentage.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-charcoal/65">
                The Passport is generated from the project's actual records. Each readiness check
                reports complete, partial, missing or not assessed. There is no invented overall
                score and no implication of patentability.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: BookOpenCheck, title: "Eight structured sections", body: "Identity, landscape, evidence, differentiation, needs, requirements, readiness, next steps." },
                  { icon: FileCheck2, title: "Printable and exportable", body: "Print to PDF or download the evidence record as Markdown." },
                  { icon: CompassStar, title: "Unresolved questions stay visible", body: "What you do not know is part of the research record." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-xl border border-forest/10 bg-card p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-forest">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-forest">{item.title}</p>
                      <p className="mt-1 text-[0.72rem] leading-5 text-charcoal/60">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-forest/10 bg-lavender/25">
          <div className="mx-auto flex max-w-[1220px] flex-col items-center gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:justify-between">
            <div className="flex items-center gap-5">
              <BookScene className="h-24 w-28 shrink-0" />
              <div>
                <p className="label-caps text-forest/45">Prior Art Lab</p>
                <h2 className="mt-2 font-display text-2xl text-forest">Public repository metadata, not a patent search.</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-charcoal/60">
                  Search live GitHub repositories for names, descriptions, languages, topics,
                  stars, licences and timestamps. BuildScope states the limits of the source.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full border-forest/25 text-forest hover:bg-ivory">
              <Link to="/prior-art">
                Open Prior Art Lab <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-[1220px] px-4 py-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Private investigations",
                body: "The workspace now requires an account and scopes investigations to the authenticated owner. Public landing content remains readable without sign-in.",
              },
              {
                title: "No fabricated research",
                body: "Hackathon results are unverified leads. Comparable projects come from retrieved pages. Missing evidence is shown as missing.",
              },
              {
                title: "Limits are part of the product",
                body: "Similarity is not originality proof, excerpts do not prove every claim, and verification does not prove market demand.",
              },
            ].map((item) => (
              <InfoNote key={item.title} tone="cream" className="block h-full p-4">
                <span className="block font-display text-lg text-forest">{item.title}</span>
                <span className="mt-1 block text-[0.72rem] leading-5 text-forest/60">{item.body}</span>
              </InfoNote>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1220px] px-4 pb-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[32px] bg-forest px-6 py-12 text-center text-ivory sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden>
              <svg viewBox="0 0 800 300" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
                <circle cx="400" cy="290" r="190" fill="none" stroke="#D5B77A" strokeWidth="1" />
                <circle cx="400" cy="290" r="140" fill="none" stroke="#D5B77A" strokeWidth="1" />
                <circle cx="400" cy="290" r="90" fill="none" stroke="#D5B77A" strokeWidth="1" />
                <path d="M400 100v190M310 290h180" stroke="#D5B77A" strokeWidth="1" />
              </svg>
            </div>
            <div className="relative">
              <CompassStar className="mx-auto size-9 text-gold" />
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-[2.7rem]">
                Bring an idea. Leave with a research record.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ivory/65">
                Create a project, run a real investigation, analyse public evidence and generate a
                Passport that tells you what is still unproven.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-ivory px-6 text-forest hover:bg-cream">
                  <Link to="/dashboard">Open the workspace</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full border border-ivory/25 text-ivory hover:bg-ivory/10">
                  <Link to="/method">Read the method &amp; limits</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-forest/10">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-forest">
              <CompassStar className="size-4 text-gold" />
            </span>
            <div>
              <p className="font-display text-lg leading-none text-forest">BuildScope AI</p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-forest/45">
                Discover. Investigate. Prove.
              </p>
            </div>
          </div>
          <p className="max-w-md text-[0.68rem] leading-5 text-charcoal/50">
            Powered by the existing FastAPI research service, TinyFish retrieval and live public
            GitHub metadata. BuildScope does not certify originality, patentability or product-market fit.
          </p>
        </div>
      </footer>
    </div>
  );
}
