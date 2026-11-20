import { api, errorMessage, type Project, type ProjectReport } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { formatDate } from "@/lib/format";
import {
  ArrowUpRight,
  BookOpenCheck,
  ClipboardCheck,
  FileSearch,
  FolderKanban,
  Github,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Chip,
  EmptyState,
  ErrorNote,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
  ToneIcon,
} from "@/components/common";
import { CubeScene } from "@/components/decor/Scenes";

type Entry = {
  project: Project;
  report: ProjectReport | null;
  failure: string | null;
};

async function loadProjects(signal: AbortSignal): Promise<Entry[]> {
  const projects = await api.listProjects(signal);
  return Promise.all(
    projects.map(async (project) => {
      try {
        return { project, report: await api.getReport(project.id, signal), failure: null };
      } catch (error) {
        return { project, report: null, failure: errorMessage(error) };
      }
    }),
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useResource((signal) => loadProjects(signal), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const dialogOpen = searchParams.get("new") === "1";
  const setDialogOpen = (open: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (open) next.set("new", "1");
    else next.delete("new");
    setSearchParams(next, { replace: true });
  };

  const entries = projects.data ?? [];
  const statuses = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.project.status))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (status !== "all" && entry.project.status !== status) return false;
      if (!needle) return true;
      return `${entry.project.name} ${entry.project.description} ${entry.project.problem_statement} ${entry.project.target_users.join(" ")} ${entry.project.keywords.join(" ")}`
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, query, status]);

  const totalComparable = entries.reduce(
    (sum, entry) => sum + (entry.report?.similar_projects.length ?? 0),
    0,
  );
  const totalNeeds = entries.reduce((sum, entry) => sum + (entry.report?.needs.length ?? 0), 0);

  if (projects.loading) return <LoadingBlock label="Loading investigations" />;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Projects"
        title={
          <>
            Investigate the idea.
            <br />
            <span className="italic text-forest/60">Then decide what to build.</span>
          </>
        }
        description="Each project is a research case file: a recorded problem, a landscape of comparable work, public evidence, stakeholder needs and testable requirements. Projects are stored by the existing FastAPI service."
        actions={
          <>
            <Button type="button" size="sm" onClick={() => setDialogOpen(true)} className="rounded-full bg-forest">
              <Plus className="size-3.5" aria-hidden /> New investigation
            </Button>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {entries.length} project{entries.length === 1 ? "" : "s"}
            </span>
          </>
        }
        aside={<CubeScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      {projects.error && <ErrorNote>{projects.error}</ErrorNote>}
      <InfoNote tone="peach">
        <span>
          <strong className="font-semibold">Shared backend workspace.</strong> The deployed FastAPI
          service has no authentication or per-user ownership, so every project is visible to every
          visitor. BuildScope labels this instead of presenting a fake sign-in.
        </span>
      </InfoNote>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            All projects
          </Chip>
          {statuses.map((option) => (
            <Chip key={option} active={status === option} onClick={() => setStatus(option)} className="capitalize">
              {option}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Investigations", value: entries.length, detail: "real backend records", icon: FolderKanban },
          { label: "Comparable projects", value: totalComparable, detail: "retrieved from public pages", icon: Github },
          { label: "Stakeholder needs", value: totalNeeds, detail: "with evidence status", icon: Users },
          { label: "Ready for Passport", value: entries.filter((entry) => (entry.report?.similar_projects.length ?? 0) > 0).length, detail: "with a retrieved landscape", icon: BookOpenCheck },
        ].map((metric) => (
          <div key={metric.label} className="paper rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-forest/45">{metric.label}</p>
              <metric.icon className="size-4 text-forest/35" aria-hidden />
            </div>
            <p className="tnum mt-2 font-display text-3xl leading-none text-forest">{metric.value}</p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </section>

      {projects.error ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={RefreshCw}
            title="The research service did not answer"
            description="No local demo projects are shown as a substitute. Try again once the FastAPI service is reachable."
            action={
              <Button variant="outline" size="sm" className="rounded-full" onClick={projects.reload}>
                <RefreshCw className="size-3.5" aria-hidden /> Try again
              </Button>
            }
          />
        </div>
      ) : entries.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            scene={<CubeScene className="h-24 w-28" />}
            icon={FolderKanban}
            title="No projects yet"
            description="Start with a real problem and a target user. Research, evidence and the Passport are built on top of that record."
            action={
              <Button type="button" size="sm" onClick={() => setDialogOpen(true)} className="rounded-full bg-forest">
                <Plus className="size-3.5" aria-hidden /> Create your first project
              </Button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={Search}
            title="No matching projects"
            description="Try a different status or search phrase."
            action={
              <Button size="sm" variant="outline" onClick={() => { setStatus("all"); setQuery(""); }}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ project, report, failure }) => {
            const similar = report?.similar_projects ?? [];
            const needs = report?.needs ?? [];
            const opportunities = report?.opportunities ?? [];
            return (
              <article key={project.id} className="paper group relative flex flex-col rounded-2xl p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-38px_rgba(16,44,35,0.5)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ToneIcon
                      icon={FolderKanban}
                      tone={project.status === "draft" ? "cream" : "lavender"}
                      className="size-9"
                    />
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                        Investigation
                      </p>
                      <h2 className="font-display text-lg leading-tight text-forest">
                        <Link to={`/projects/${project.id}`} className="hover:underline">
                          {project.name}
                        </Link>
                      </h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] text-forest/60">
                    {project.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-[0.74rem] leading-5 text-charcoal/65">
                  {project.description}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {project.target_users.slice(0, 2).map((user) => (
                    <Tag key={user} tone="sage">{user}</Tag>
                  ))}
                  {project.keywords.slice(0, 2).map((keyword) => (
                    <Tag key={keyword} tone="lavender">{keyword}</Tag>
                  ))}
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { label: "Landscape", value: similar.length },
                    { label: "Needs", value: needs.length },
                    { label: "Leads", value: opportunities.length },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-cream/50 px-2 py-1.5">
                      <dt className="text-[0.55rem] uppercase tracking-[0.06em] text-muted-foreground">{item.label}</dt>
                      <dd className="tnum font-display text-base text-forest">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                {failure ? (
                  <p className="mt-2 line-clamp-2 text-[0.62rem] leading-4 text-destructive">
                    Partial data: {failure}
                  </p>
                ) : (
                  <p className="mt-2 line-clamp-1 text-[0.62rem] text-forest/55">
                    {similar.length > 0
                      ? `Latest comparable: ${similar[0].name}`
                      : "No research landscape retrieved yet"}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <span className="text-[0.58rem] text-muted-foreground">
                    Created {formatDate(project.created_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[0.65rem] text-forest">
                      <Link to={`/projects/${project.id}`}>
                        Open <ArrowUpRight className="size-3" aria-hidden />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" className="text-forest/50 hover:text-forest" aria-label={`Open Passport for ${project.name}`}>
                      <Link to={`/projects/${project.id}/passport`}>
                        <BookOpenCheck className="size-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SectionCard title="What each investigation can record" icon={ShieldCheck} className="text-[0.75rem]">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { title: "Landscape", body: "Public comparable projects, features, limitations and source URLs." },
            { title: "Evidence", body: "Verbatim excerpts, relation, retrieval date and verification flag." },
            { title: "Proof chain", body: "Opportunity → requirement → acceptance test → verification result." },
          ].map((item, index) => (
            <div key={item.title} className="rounded-xl border border-border/70 bg-cream/30 p-3">
              <p className="text-[0.6rem] uppercase tracking-[0.12em] text-forest/40">0{index + 1}</p>
              <p className="mt-1 font-display text-base text-forest">{item.title}</p>
              <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-peach/35 px-3 py-2 text-[0.65rem] leading-4 text-forest/65">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          The backend currently exposes create, list and read for projects. Editing and deleting a
          project are not implemented, so those controls are not shown.
        </div>
        <div className="mt-2 flex items-center gap-2 text-[0.65rem] text-forest/55">
          <ClipboardCheck className="size-3.5" aria-hidden />
          Project requirements are saved through the proof-chain API.
          <FileSearch className="ml-2 size-3.5" aria-hidden />
          Research runs are background jobs.
        </div>
      </SectionCard>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(id) => navigate(`/projects/${id}?tab=research`)}
      />
    </div>
  );
}
