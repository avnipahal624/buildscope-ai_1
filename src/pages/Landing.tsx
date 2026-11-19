import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Compass,
  Database,
  FileCheck2,
  GitBranch,
  Github,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router";
import {
  ArchScene,
  BookScene,
  CompassOrb,
  CompassStar,
  LaptopScene,
  Tilt,
  Wordmark,
} from "@/components/decor/Scenes";
import { Button } from "@/components/ui/button";
import { MatchBadge, StatusPill, Tag } from "@/components/common";

const STAGES = [
  {
    id: "01",
    title: "Discover",
    icon: Radar,
    tone: "bg-sage",
    body: "A radar built around your branch, year, skills and goals — with the reason behind every match shown in full.",
    detail: ["Skill-aware matching", "Eligibility checks", "Saved shortlists"],
  },
  {
    id: "02",
    title: "Prepare",
    icon: BookOpen,
    tone: "bg-peach",
    body: "Turn a target into a staged learning roadmap: foundation, practice, application, project-ready.",
    detail: ["Gap analysis", "Curated resources", "Time estimates"],
  },
  {
    id: "03",
    title: "Build",
    icon: GitBranch,
    tone: "bg-lavender",
    body: "Create projects, link repositories and keep milestones honest — evidence over adjectives.",
    detail: ["Project workspace", "Milestones", "Repository checks"],
  },
  {
    id: "04",
    title: "Prove",
    icon: FileCheck2,
    tone: "bg-[#F0E3C8]",
    body: "Generate a progress report backed by verified links, completed work and real repository data.",
    detail: ["Evidence pack", "Progress timeline", "Shareable report"],
  },
];

const DEMO_MATCHES = [
  {
    name: "Northstar Campus Hack Sprint",
    meta: "AI & Developer Tools · Online",
    score: 82,
    skills: ["React", "Python"],
    gap: "Machine Learning",
  },
  {
    name: "Design Systems Sprint",
    meta: "Product Design · Online",
    score: 74,
    skills: ["React", "Figma"],
    gap: "Design Systems",
  },
  {
    name: "Civic Data Relay",
    meta: "Civic Tech & Data · Online",
    score: 61,
    skills: ["Python"],
    gap: "SQL",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const primary = isAuthenticated ? "/dashboard" : "/auth";
  const primaryLabel = isAuthenticated ? "Open your workspace" : "Start your workspace";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-ivory/95">
        <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="BuildScope home" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-forest">
              <CompassStar className="size-5 text-gold" />
            </span>
            <span>
              <span className="block font-display text-xl leading-none text-forest">BuildScope</span>
              <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.2em] text-forest/50">
                Discover. Prepare. Prove.
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-forest/70 md:flex" aria-label="Primary">
            <a href="#stages" className="transition-colors hover:text-forest">The method</a>
            <a href="#radar" className="transition-colors hover:text-forest">Radar</a>
            <a href="#evidence" className="transition-colors hover:text-forest">Evidence</a>
            <a href="#proof" className="transition-colors hover:text-forest">Progress</a>
          </nav>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/auth"
                className="hidden rounded-full px-3 py-2 text-sm text-forest/70 transition-colors hover:text-forest sm:block"
              >
                Sign in
              </Link>
            )}
            <Button asChild className="rounded-full bg-forest text-ivory hover:bg-forest-deep">
              <Link to={primary}>
                {primaryLabel}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 top-10 size-[420px] rounded-full bg-sage/40 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute right-0 top-24 size-[360px] rounded-full bg-peach/30 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-[1220px] gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-6 lg:pb-20 lg:pt-16">
            <div>
              <p className="label-caps inline-flex items-center gap-2 rounded-full border border-forest/15 bg-cream px-3 py-1.5 text-forest/70">
                <Sparkles className="size-3.5 text-gold" aria-hidden />
                Student opportunity intelligence
              </p>
              <h1 className="mt-5 font-display text-[2.8rem] leading-[0.98] tracking-[-0.02em] text-forest sm:text-[3.6rem] lg:text-[4.15rem]">
                Find the opportunity.
                <br />
                <span className="text-forest/55 italic">Become ready</span> for it.
                <br />
                Prove what you built.
              </h1>
              <p className="mt-6 max-w-lg text-[0.98rem] leading-7 text-charcoal/70">
                BuildScope connects hackathons, skill gaps, preparation and project evidence in one
                calm workspace. No invented stats. No fabricated achievements. Just the next
                honest step.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-forest px-6 text-ivory hover:bg-forest-deep">
                  <Link to={primary}>
                    {primaryLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <a
                  href="#evidence"
                  className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-5 py-3 text-sm text-forest transition-colors hover:bg-cream"
                >
                  <ShieldCheck className="size-4" aria-hidden />
                  See how evidence works
                </a>
              </div>
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs text-forest/65">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Data honesty</dt>
                  <dd>Demo records are labelled</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Repository checks</dt>
                  <dd>Real GitHub evidence</dd>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-forest/40" aria-hidden />
                  <dt className="sr-only">Scoring</dt>
                  <dd>Every score has a formula</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="stage-wide relative overflow-hidden rounded-[32px] border border-border/70 bg-cream/70 p-2 shadow-[0_40px_80px_-60px_rgba(16,44,35,0.55)]">
                <ArchScene className="aspect-[1.35/1] w-full rounded-[26px]" />
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="rounded-2xl border border-forest/10 bg-ivory/95 px-4 py-3 shadow-float">
                    <p className="label-caps text-forest/50">Preparation score · preview</p>
                    <p className="tnum mt-1 font-display text-3xl leading-none text-forest">78%</p>
                    <p className="mt-1 text-[0.65rem] text-charcoal/60">Roadmap 40 · Milestones 25 · Skills 20 · Evidence 15</p>
                  </div>
                  <div className="hidden rounded-2xl border border-forest/10 bg-forest px-4 py-3 text-ivory shadow-float sm:block">
                    <p className="label-caps text-ivory/50">Next move</p>
                    <p className="mt-1 max-w-[170px] text-xs leading-5">
                      Finish the React fundamentals block before 4 Dec
                    </p>
                  </div>
                </div>
              </div>
              <div className="float-y-slow absolute -bottom-6 -left-3 hidden w-[180px] rounded-2xl border border-forest/10 bg-card p-3 shadow-float sm:block">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-sage">
                    <Trophy className="size-4 text-forest" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">Radar</p>
                    <p className="text-xs font-semibold text-forest">3 strong matches</p>
                  </div>
                </div>
                <p className="mt-2 text-[0.65rem] leading-4 text-muted-foreground">
                  Each with a visible reason and skill gap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Method strip */}
        <section id="stages" className="mx-auto max-w-[1220px] px-4 pb-16 sm:px-6">
          <div className="flex flex-col justify-between gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:items-end">
            <p className="label-caps text-forest/45">The BuildScope method</p>
            <p className="max-w-md text-sm leading-6 text-charcoal/60">
              Four stages, one continuous record. Your profile feeds matching, matching feeds the
              roadmap, and the roadmap feeds the evidence you can prove.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
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
                  <p className="mt-2 text-[0.8rem] leading-6 text-charcoal/70">{stage.body}</p>
                  <ul className="mt-4 space-y-1.5 text-[0.7rem] text-forest/65">
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

        {/* Radar preview */}
        <section id="radar" className="border-y border-forest/10 bg-cream/60">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="label-caps text-forest/45">Hackathon Radar</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl">
                A shortlist that explains itself
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-charcoal/65">
                Match scores come from four visible inputs: skill coverage (60), domain fit (20),
                eligibility (15) and preparation time (5). Open any opportunity to see the exact
                breakdown — and the skills standing between you and a strong application.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-charcoal/70">
                {[
                  "Eligibility is checked against your academic year.",
                  "Gaps become roadmap tasks in one click.",
                  "Demo records are visibly marked — never passed off as live.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-sage text-forest">
                      <BadgeCheck className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 rounded-full border-forest/25 text-forest hover:bg-ivory">
                <Link to={primary}>
                  Explore the radar <ArrowUpRight className="size-4" aria-hidden />
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
                      <p className="font-display text-lg leading-none text-forest">Recommended</p>
                      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-forest/45">
                        Demo catalogue · labelled
                      </p>
                    </div>
                  </div>
                  <Tag tone="peach">Demo data</Tag>
                </div>
                <ul className="divide-y divide-forest/10">
                  {DEMO_MATCHES.map((match) => (
                    <li key={match.name} className="flex flex-wrap items-center gap-3 py-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cream">
                        <CompassStar className="size-5 text-forest/70" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forest">{match.name}</p>
                        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{match.meta}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {match.skills.map((skill) => (
                            <Tag key={skill} tone="sage">{skill}</Tag>
                          ))}
                          <Tag tone="peach">Gap: {match.gap}</Tag>
                        </div>
                      </div>
                      <MatchBadge score={match.score} />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-lg bg-cream/80 px-3 py-2 text-[0.65rem] leading-5 text-forest/60">
                  These are demonstration records with no official listing. BuildScope never
                  invents real hackathon deadlines or prize pools.
                </p>
              </div>
            </Tilt>
          </div>
        </section>

        {/* Evidence */}
        <section id="evidence" className="bg-forest text-ivory">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="label-caps text-gold/80">Credibility checks</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-[2.6rem]">
                Evidence, not accusations.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-ivory/70">
                Paste a public GitHub URL and BuildScope reads the repository itself: metadata,
                commits, README, licence, workflows, dependencies, file fingerprints, fork
                ancestry and related public repositories.
              </p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  { icon: Github, title: "Real repository data", body: "Fetched live from the GitHub REST API." },
                  { icon: ShieldCheck, title: "Honest gaps", body: "AST and code similarity shown as Not assessed." },
                  { icon: GitBranch, title: "Ancestry, not verdicts", body: "Fork links are context, never proof of theft." },
                  { icon: Database, title: "Limitations included", body: "Every finding carries its caveat." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-ivory/10 bg-forest-deep/50 p-3.5">
                    <item.icon className="size-4 text-gold" aria-hidden />
                    <p className="mt-2 text-xs font-semibold text-ivory">{item.title}</p>
                    <p className="mt-1 text-[0.68rem] leading-5 text-ivory/60">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Verified", "Evidence found", "Needs review", "Not assessed"].map((status) => (
                  <span
                    key={status}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em]",
                      status === "Verified" && "bg-sage text-forest",
                      status === "Evidence found" && "bg-gold/90 text-[#3B2E12]",
                      status === "Needs review" && "bg-peach text-[#5E3326]",
                      status === "Not assessed" && "bg-ivory/15 text-ivory/70",
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
                <div className="float-y absolute -left-4 top-2 w-[190px] rounded-xl border border-ivory/15 bg-forest-deep/90 p-3 backdrop-blur-none">
                  <p className="text-[0.58rem] uppercase tracking-[0.14em] text-ivory/45">Repository check</p>
                  <p className="mt-1 truncate text-xs font-semibold text-ivory">buildscope/demo-repo</p>
                  <div className="mt-2 space-y-1.5 text-[0.6rem] text-ivory/60">
                    <p className="flex justify-between"><span>Commits sampled</span><span className="tnum text-ivory">30</span></p>
                    <p className="flex justify-between"><span>Files fingerprinted</span><span className="tnum text-ivory">142</span></p>
                    <p className="flex justify-between"><span>Fork relationship</span><span className="text-sage">none</span></p>
                  </div>
                  <div className="mt-2">
                    <StatusPill status="Evidence found" className="bg-gold/90 text-[#3B2E12]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof */}
        <section id="proof" className="mx-auto max-w-[1220px] px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative flex justify-center">
              <div className="stage grid place-items-center">
                <CompassOrb className="size-[300px]" value={64} />
              </div>
              <div className="absolute bottom-2 right-2 hidden w-[220px] rounded-2xl border border-forest/10 bg-card p-4 shadow-float sm:block">
                <p className="label-caps text-forest/45">Progress hub</p>
                <p className="mt-1 font-display text-lg leading-tight text-forest">
                  A report built from what you actually did
                </p>
                <ul className="mt-2 space-y-1 text-[0.65rem] text-muted-foreground">
                  <li>✓ Completed roadmap tasks</li>
                  <li>✓ Milestones and projects</li>
                  <li>✓ Verified evidence links</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="label-caps text-forest/45">Progress Hub</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl">
                Keep the receipts.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-charcoal/65">
                BuildScope only counts what you finish or verify yourself. Achievements are drawn
                from completed tasks, milestones and evidence checks — never auto-awarded, never
                inflated.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: Target, title: "Preparation score with a formula", body: "Roadmap 40 · milestones 25 · skills 20 · evidence 15, renormalised over components with data." },
                  { icon: FileCheck2, title: "Shareable progress report", body: "Skills developed, projects, milestones, opportunities and verified links in one document." },
                  { icon: BookOpen, title: "Learning library", body: "Saved opportunities, curated resources and repository reports in one place." },
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

        {/* Library strip */}
        <section className="border-y border-forest/10 bg-lavender/25">
          <div className="mx-auto flex max-w-[1220px] flex-col items-center gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:justify-between">
            <div className="flex items-center gap-5">
              <BookScene className="h-24 w-28 shrink-0" />
              <div>
                <p className="label-caps text-forest/45">Research library</p>
                <h2 className="mt-2 font-display text-2xl text-forest">Everything you saved, in one place.</h2>
                <p className="mt-1 max-w-sm text-sm leading-6 text-charcoal/60">
                  Opportunities, learning sources, repository reports and progress reports —
                  searchable, filterable and removable.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full border-forest/25 text-forest hover:bg-ivory">
              <Link to={primary}>
                Open the workspace <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-[1220px] px-4 py-16 sm:px-6">
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
                Your next opportunity starts with knowing where you stand.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ivory/65">
                Build a profile, find a fitting opportunity, close the gaps and prove the work.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-ivory px-6 text-forest hover:bg-cream">
                  <Link to={primary}>{primaryLabel}</Link>
                </Button>
                {!isAuthenticated && (
                  <Button asChild size="lg" variant="ghost" className="rounded-full border border-ivory/25 text-ivory hover:bg-ivory/10">
                    <Link to="/auth">I already have an account</Link>
                  </Button>
                )}
              </div>
              <p className="mt-4 text-[0.65rem] text-ivory/40">
                Demo catalogue records are used where live discovery is unavailable.
              </p>
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
                Discover. Prepare. Prove.
              </p>
            </div>
          </div>
          <p className="max-w-md text-[0.68rem] leading-5 text-charcoal/50">
            BuildScope does not fabricate opportunities, scores or achievements. Repository
            evidence comes from the public GitHub API; similarity is never treated as proof of
            misconduct.
          </p>
        </div>
      </footer>
    </div>
  );
}
