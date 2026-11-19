import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { matchOpportunity } from "@/lib/matching";
import { SKILL_LIBRARY } from "@/lib/skills";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  FlaskConical,
  FolderKanban,
  Github,
  Library as LibraryIcon,
  Plus,
  Radar,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Chip,
  EmptyState,
  ErrorNote,
  Field,
  InfoNote,
  LoadingBlock,
  MatchBadge,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";
import { BookScene } from "@/components/decor/Scenes";

type Entry = {
  id: string;
  title: string;
  description?: string;
  kind: "opportunity" | "resource" | "report" | "repo-report" | "research";
  url?: string;
  createdAt: number;
  payload?: unknown;
  source: "saved" | "library";
  opportunity?: Doc<"opportunities">;
};

const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "opportunity", label: "Opportunities" },
  { key: "resource", label: "Learning" },
  { key: "report", label: "Reports" },
  { key: "repo-report", label: "Repository reports" },
  { key: "research", label: "Research" },
];

const KIND_ICON = {
  opportunity: Radar,
  resource: BookOpen,
  report: FileText,
  "repo-report": Github,
  research: FlaskConical,
};

export default function Library() {
  const { user } = useAuth();
  const items = useQuery(api.workspace.library);
  const savedRows = useQuery(api.opportunities.saved);
  const removeItem = useMutation(api.workspace.removeLibraryItem);
  const toggleSave = useMutation(api.opportunities.toggleSave);
  const addItem = useMutation(api.workspace.addLibraryItem);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", url: "", kind: "resource" as "resource" | "research" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Entry | null>(null);

  const entries = useMemo<Entry[]>(() => {
    const savedEntries: Entry[] = (savedRows ?? []).map(({ saved, opportunity }) => ({
      id: `saved-${saved._id}`,
      title: opportunity.name,
      description: opportunity.description,
      kind: "opportunity",
      createdAt: saved.createdAt,
      source: "saved",
      opportunity,
    }));
    const libraryEntries: Entry[] = (items ?? []).map((item) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      kind: item.kind === "saved" ? "opportunity" : item.kind,
      url: item.url,
      createdAt: item.createdAt,
      payload: item.payload,
      source: "library",
    }));
    return [...libraryEntries, ...savedEntries].sort((a, b) => b.createdAt - a.createdAt);
  }, [items, savedRows]);

  const filtered = entries.filter((entry) => {
    if (filter !== "all") {
      if (filter === "report" && !["report", "repo-report"].includes(entry.kind)) return false;
      if (filter !== "report" && entry.kind !== filter) return false;
    }
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return `${entry.title} ${entry.description ?? ""}`.toLowerCase().includes(needle);
  });

  const addSource = async () => {
    if (draft.title.trim().length < 3) {
      setError("Give the source a title.");
      return;
    }
    if (draft.url.trim() && !/^https?:\/\//i.test(draft.url.trim())) {
      setError("Use a full http(s) URL, or leave the link empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addItem({
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        kind: draft.kind,
        url: draft.url.trim() || undefined,
      });
      toast.success("Saved to your library.");
      setAddOpen(false);
      setDraft({ title: "", description: "", url: "", kind: "resource" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the item.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry: Entry) => {
    try {
      if (entry.source === "saved" && entry.opportunity) {
        await toggleSave({ opportunityId: entry.opportunity._id });
      } else {
        await removeItem({ itemId: entry.id as never });
      }
      toast.success("Removed from your library.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the item.");
    }
  };

  if (items === undefined || savedRows === undefined) {
    return <LoadingBlock label="Opening the library" />;
  }

  const reportPayload = viewing && typeof viewing.payload === "object" && viewing.payload
    ? (viewing.payload as { markdown?: string })
    : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Research Library"
        title={
          <>
            Everything you kept,
            <br />
            <span className="italic text-forest/60">one quiet shelf.</span>
          </>
        }
        description="Saved opportunities, curated learning sources, research notes, repository reports and project reports — searchable and removable."
        actions={
          <>
            <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-full bg-forest">
              <Plus className="size-3.5" aria-hidden /> Add a source
            </Button>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {entries.length} item{entries.length === 1 ? "" : "s"}
            </span>
          </>
        }
        aside={<BookScene className="hidden h-[130px] w-[140px] lg:block" />}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <Chip key={option.key} active={filter === option.key} onClick={() => setFilter(option.key)}>
              {option.label}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the library"
            aria-label="Search library"
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            scene={<BookScene className="h-24 w-28" />}
            icon={LibraryIcon}
            title={entries.length === 0 ? "Your library is empty" : "Nothing matches that search"}
            description={
              entries.length === 0
                ? "Save an opportunity from the radar, add a research source, or save a generated report. Everything stays in one library."
                : "Try another category or clear the search."
            }
            action={
              entries.length === 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="sm" className="rounded-full bg-forest">
                    <Link to="/radar">Browse the radar</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddOpen(true)}>
                    Add a source
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => {
            const Icon = KIND_ICON[entry.kind];
            return (
              <article key={entry.id} className="paper flex flex-col rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-cream text-forest">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="label-caps text-forest/45">
                      {entry.kind === "repo-report" ? "Repository report" : entry.kind === "opportunity" ? "Opportunity" : entry.kind}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(entry)}
                    aria-label={`Remove ${entry.title}`}
                    className="rounded-full p-1 text-forest/30 transition-colors hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
                <h2 className="mt-2 font-display text-lg leading-tight text-forest">
                  {entry.kind === "opportunity" && entry.opportunity ? (
                    <Link to={`/radar/${entry.opportunity._id}`} className="hover:underline">{entry.title}</Link>
                  ) : (
                    entry.title
                  )}
                </h2>
                <p className="mt-1 line-clamp-3 flex-1 text-[0.72rem] leading-5 text-charcoal/60">
                  {entry.description || "No description saved."}
                </p>
                {entry.opportunity && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <MatchBadge
                      score={
                        matchOpportunity(entry.opportunity, {
                          skills: user?.skills,
                          domains: user?.domains,
                          interests: user?.interests,
                          academicYear: user?.academicYear,
                          weeklyHours: user?.weeklyHours,
                        }).score
                      }
                    />
                    <Tag tone="cream">{formatDate(entry.opportunity.registrationDeadline)} deadline</Tag>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                  <span className="text-[0.6rem] text-muted-foreground">Added {formatDate(entry.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {reportPayload?.markdown && (
                      <Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[0.62rem] text-forest" onClick={() => setViewing(entry)}>
                        View
                      </Button>
                    )}
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[0.62rem] text-forest/60 hover:text-forest"
                      >
                        Source <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SectionCard title="Curated learning sources" icon={Sparkles} eyebrow="Real, public documentation">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SKILL_LIBRARY.filter((skill) => skill.resourceUrl).slice(0, 9).map((skill) => (
            <div key={skill.name} className="flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-cream/25 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-[0.72rem] font-medium text-forest">{skill.resourceLabel}</p>
                <p className="text-[0.6rem] text-muted-foreground">{skill.name} · {skill.hours}h estimate</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a href={skill.resourceUrl} target="_blank" rel="noreferrer noopener" aria-label={`Open ${skill.resourceLabel}`} className="text-forest/40 hover:text-forest">
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <button
                  type="button"
                  aria-label={`Save ${skill.resourceLabel} to library`}
                  onClick={async () => {
                    await addItem({
                      title: skill.resourceLabel ?? skill.name,
                      description: `${skill.category} · curated source for ${skill.name}`,
                      kind: "resource",
                      url: skill.resourceUrl,
                    });
                    toast.success("Curated source saved to your library.");
                  }}
                  className="text-forest/40 hover:text-forest"
                >
                  <BookMarked className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
        <InfoNote tone="cream">
          BuildScope does not invent course links. These are public documentation sources; time
          estimates are guidance, not a guarantee.
        </InfoNote>
      </SectionCard>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-border bg-card sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-forest">Add a source</DialogTitle>
            <DialogDescription>
              Save a learning resource or research note. You provide the link, so nothing is invented.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Type" htmlFor="library-kind">
              <select
                id="library-kind"
                value={draft.kind}
                onChange={(event) => setDraft({ ...draft, kind: event.target.value as "resource" | "research" })}
                className="h-9 w-full rounded-md border border-input bg-ivory/60 px-2 text-sm text-forest"
              >
                <option value="resource">Learning resource</option>
                <option value="research">Research source</option>
              </select>
            </Field>
            <Field label="Title" htmlFor="library-title">
              <Input id="library-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Paper: retrieval-augmented generation" className="bg-ivory/60" />
            </Field>
            <Field label="Description" htmlFor="library-description" hint="Optional">
              <Textarea id="library-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={2} className="bg-ivory/60" />
            </Field>
            <Field label="Source URL" htmlFor="library-url" hint="Optional — must start with http(s).">
              <Input id="library-url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://…" className="bg-ivory/60" />
            </Field>
            {error && <ErrorNote>{error}</ErrorNote>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => void addSource()} disabled={saving} className="rounded-full bg-forest px-5">
              {saving ? "Saving" : "Save to library"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-forest">{viewing?.title}</DialogTitle>
            <DialogDescription>Saved report · {viewing ? formatDate(viewing.createdAt) : ""}</DialogDescription>
          </DialogHeader>
          <pre className={cn("max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-cream/30 p-3 font-mono text-[0.68rem] leading-5 text-forest/80")}>
            {reportPayload?.markdown ?? "No saved report body."}
          </pre>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-[0.68rem]"
              onClick={async () => {
                if (!reportPayload?.markdown) return;
                await navigator.clipboard.writeText(reportPayload.markdown);
                toast.success("Report copied.");
              }}
            >
              Copy markdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
