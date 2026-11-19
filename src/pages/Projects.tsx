import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  FolderKanban,
  GitBranch,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Chip,
  ConfirmButton,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
  ToneIcon,
} from "@/components/common";
import { CubeScene } from "@/components/decor/Scenes";

const STATUSES = ["all", "idea", "building", "testing", "shipped"] as const;

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useQuery(api.projects.list);
  const removeProject = useMutation(api.projects.remove);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const dialogOpen = searchParams.get("new") === "1";
  const setDialogOpen = (open: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (open) next.set("new", "1");
    else next.delete("new");
    setSearchParams(next, { replace: true });
  };

  if (projects === undefined) return <LoadingBlock label="Loading your projects" />;

  const filtered = projects.filter(({ project }) => {
    if (status !== "all" && project.status !== status) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return `${project.name} ${project.description} ${project.domain} ${project.technologies.join(" ")}`
      .toLowerCase()
      .includes(needle);
  });

  const totalMilestones = projects.reduce((sum, entry) => sum + entry.milestones.length, 0);
  const doneMilestones = projects.reduce((sum, entry) => sum + entry.doneCount, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="My Projects"
        title={
          <>
            Build the thing.
            <br />
            <span className="italic text-forest/60">Keep the evidence.</span>
          </>
        }
        description="A project is more than a repository. Track milestones, record what actually works, and run credibility checks when you are ready to show it."
        actions={
          <>
            <Button type="button" size="sm" onClick={() => setDialogOpen(true)} className="rounded-full bg-forest">
              <Plus className="size-3.5" aria-hidden /> New project
            </Button>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {doneMilestones}/{totalMilestones} milestones complete
            </span>
          </>
        }
        aside={<CubeScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((option) => (
            <Chip key={option} active={status === option} onClick={() => setStatus(option)} className="capitalize">
              {option === "all" ? "All projects" : option}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-[240px]">
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

      {projects.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            scene={<CubeScene className="h-24 w-28" />}
            icon={FolderKanban}
            title="No projects yet"
            description="Start with something small and real. Add milestones so progress means something, then link a repository to collect evidence."
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
            action={<Button size="sm" variant="outline" onClick={() => { setStatus("all"); setQuery(""); }}>Clear filters</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ project, milestones, doneCount }) => {
            const progress = milestones.length === 0 ? 0 : Math.round((doneCount / milestones.length) * 100);
            const next = milestones.find((milestone) => !milestone.completed);
            return (
              <article key={project._id} className="paper group relative flex flex-col rounded-2xl p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-38px_rgba(16,44,35,0.5)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ToneIcon icon={FolderKanban} tone={project.status === "shipped" ? "sage" : project.status === "idea" ? "cream" : "lavender"} className="size-9" />
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">{project.domain}</p>
                      <h2 className="font-display text-lg leading-tight text-forest">
                        <Link to={`/projects/${project._id}`} className="hover:underline">{project.name}</Link>
                      </h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] text-forest/60">
                    {project.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-[0.74rem] leading-5 text-charcoal/65">{project.description}</p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <Tag key={tech} tone="lavender">{tech}</Tag>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[0.62rem] text-muted-foreground">
                    <span>{doneCount}/{milestones.length} milestones</span>
                    <span className="tnum">{progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/10">
                    <div className="h-full rounded-full bg-forest/55 transition-[width]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 line-clamp-1 text-[0.62rem] text-forest/55">
                    <Target className="size-3 shrink-0" aria-hidden />
                    {next ? `Next: ${next.title}${next.dueDate ? ` · ${formatDate(next.dueDate)}` : ""}` : milestones.length === 0 ? "No milestones yet" : "All milestones complete"}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className={cn("size-3", project.repoUrl ? "text-forest/60" : "text-muted-foreground/40")} aria-hidden />
                    <span className="text-[0.6rem] text-muted-foreground">
                      {project.repoUrl ? (project.repoCheckId ? "repo verified" : "repo linked") : "no repo"}
                    </span>
                    <ShieldCheck className={cn("ml-1 size-3", project.repoCheckId ? "text-forest/60" : "text-muted-foreground/30")} aria-hidden />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button asChild variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[0.65rem] text-forest">
                      <Link to={`/projects/${project._id}`}>Open <ArrowUpRight className="size-3" aria-hidden /></Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" className="text-forest/40 hover:text-forest">
                      <Link to={`/projects/${project._id}?tab=overview&edit=1`} aria-label={`Edit ${project.name}`}>
                        <Pencil className="size-3" aria-hidden />
                      </Link>
                    </Button>
                    <ConfirmButton
                      title="Delete this project?"
                      description={`“${project.name}”, its ${milestones.length} milestones and its repository checks will be removed. This cannot be undone.`}
                      onConfirm={async () => {
                        try {
                          await removeProject({ projectId: project._id });
                          toast.success("Project deleted.");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not delete the project.");
                        }
                      }}
                      variant="ghost"
                      className="size-7 p-0 text-forest/40 hover:text-destructive"
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </ConfirmButton>
                  </div>
                </div>
                <p className="mt-1 text-[0.55rem] text-muted-foreground/70">
                  Updated {relativeTime(project.updatedAt)} · {user?.name?.split(" ")[0] ?? "you"}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <SectionCard title="How project evidence works" icon={ShieldCheck} className="text-[0.75rem]">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { title: "Link", body: "Add a public GitHub URL to a project. No write access is requested." },
            { title: "Read", body: "BuildScope reads commits, tree fingerprints, licence and related repositories." },
            { title: "Review", body: "Findings are labelled; code similarity and AST analysis stay Not assessed." },
          ].map((item, index) => (
            <div key={item.title} className="rounded-xl border border-border/70 bg-cream/30 p-3">
              <p className="text-[0.6rem] uppercase tracking-[0.12em] text-forest/40">0{index + 1}</p>
              <p className="mt-1 font-display text-base text-forest">{item.title}</p>
              <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(id) => navigate(`/projects/${id}`)}
      />
    </div>
  );
}

