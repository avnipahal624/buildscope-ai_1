import type { LucideIcon } from "lucide-react";
import { ArrowRight, Info, Loader2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EvidenceStatus } from "@/lib/credibility";

export type Tone = "sage" | "peach" | "lavender" | "gold" | "cream" | "forest";

const TONE_BG: Record<Tone, string> = {
  sage: "bg-sage/70",
  peach: "bg-peach/70",
  lavender: "bg-lavender/70",
  gold: "bg-gold/45",
  cream: "bg-cream",
  forest: "bg-forest text-ivory",
};

export function ToneIcon({
  icon: Icon,
  tone = "sage",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        TONE_BG[tone],
        tone === "forest" ? "text-ivory" : "text-forest",
        className,
      )}
    >
      <Icon className="size-[1.15rem]" aria-hidden />
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-[26px] border border-border/70 bg-cream/50 px-5 py-6 sm:px-8 sm:py-8">
      <div className="absolute inset-0 grain opacity-60" aria-hidden />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="label-caps text-forest/55">{eyebrow}</p>}
          <h1 className="mt-3 font-display text-3xl leading-[1.05] text-forest sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
          {actions && <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}

export function SectionCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  eyebrow,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  eyebrow?: string;
}) {
  return (
    <section className={cn("paper flex flex-col rounded-2xl", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <ToneIcon icon={icon} tone="cream" className="size-8" />}
            <div className="min-w-0">
              {eyebrow && <p className="label-caps mb-1 text-muted-foreground/80">{eyebrow}</p>}
              {title && (
                <h2 className="truncate font-display text-[1.15rem] leading-tight text-forest">
                  {title}
                </h2>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1 px-4 pb-4 sm:px-5 sm:pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SeeAll({ to, label = "See all" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-xs font-medium text-forest/70 transition-colors hover:text-forest"
    >
      {label}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function ScoreRing({
  value,
  size = 120,
  label,
  sublabel,
  stroke = 9,
}: {
  value: number | null;
  size?: number;
  label?: string;
  sublabel?: string;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#183B2E" strokeOpacity="0.10" strokeWidth={stroke} />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#183B2E"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (clamped / 100) * circumference}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tnum font-display text-2xl leading-none text-forest">
          {value === null ? "—" : `${value}%`}
        </span>
        {label && <span className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>}
        {sublabel && <span className="mt-0.5 text-[0.6rem] text-muted-foreground/80">{sublabel}</span>}
      </div>
    </div>
  );
}

const DATA_LABEL: Record<string, { label: string; className: string; note: string }> = {
  demo: {
    label: "Demo data",
    className: "bg-peach/60 text-forest",
    note: "Demonstration record — not a live listing.",
  },
  live: {
    label: "Live data",
    className: "bg-sage/80 text-forest",
    note: "Sourced from a live record.",
  },
  unavailable: {
    label: "Source unavailable",
    className: "bg-cream text-muted-foreground",
    note: "No accessible source could be read.",
  },
};

export function DataBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = DATA_LABEL[status] ?? DATA_LABEL.unavailable;
  return (
    <span
      title={config.note}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em]",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

const STATUS_CLASS: Record<EvidenceStatus, string> = {
  Verified: "bg-sage text-[#1B4A2F]",
  "Evidence found": "bg-gold/50 text-forest",
  "Needs review": "bg-peach text-forest",
  "Not assessed": "bg-cream text-muted-foreground",
  "Unable to verify": "bg-destructive/10 text-destructive",
};

export function StatusPill({
  status,
  className,
}: {
  status: EvidenceStatus | string;
  className?: string;
}) {
  const key = (status in STATUS_CLASS ? status : "Not assessed") as EvidenceStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em]",
        STATUS_CLASS[key],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </span>
  );
}

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 75 ? "bg-sage text-forest" : score >= 50 ? "bg-gold/45 text-forest" : "bg-cream text-muted-foreground";
  return (
    <span className={cn("tnum inline-flex items-center rounded-md px-2 py-1 text-[0.68rem] font-semibold", tone, className)}>
      {score}% match
    </span>
  );
}

export function Tag({
  children,
  className,
  tone = "cream",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-forest/10 px-2.5 py-1 text-[0.68rem] font-medium",
        tone === "forest" ? "bg-forest text-ivory" : TONE_BG[tone],
        tone !== "forest" && "text-forest/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  scene,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  scene?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      {scene ?? (
        <span className="grid size-12 place-items-center rounded-full bg-cream text-forest">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div>
        <p className="font-display text-lg text-forest">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function InfoNote({ children, tone = "cream" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-5 text-forest/75", TONE_BG[tone])}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-forest bg-forest text-ivory"
          : "border-border bg-card text-forest/70 hover:border-forest/30 hover:text-forest",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="label-caps block text-forest/60">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[0.7rem] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[0.7rem] text-destructive">{error}</p>}
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (value.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    onChange([...value, next]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-sage/70 px-2.5 py-1 text-xs text-forest"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(value.filter((entry) => entry !== item))}
              className="rounded-full p-0.5 hover:bg-forest/10"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
          className="bg-card"
        />
        <Button type="button" variant="outline" onClick={() => add(draft)} className="shrink-0">
          Add
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((suggestion) => !value.some((item) => item.toLowerCase() === suggestion.toLowerCase()))
            .slice(0, 6)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className="rounded-full border border-dashed border-border px-2 py-0.5 text-[0.68rem] text-muted-foreground transition-colors hover:border-forest/40 hover:text-forest"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function ConfirmButton({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  children,
  className,
  variant = "destructive",
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: ReactNode;
  className?: string;
  variant?: "destructive" | "outline" | "ghost";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-forest">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PrimaryLink({
  to,
  children,
  className,
  variant = "default",
}: {
  to: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "cream";
}) {
  return (
    <Button
      asChild
      variant={variant === "outline" ? "outline" : variant === "cream" ? "secondary" : "default"}
      className={cn(
        "gap-2 rounded-full",
        variant === "cream" && "bg-ivory text-forest hover:bg-cream",
        className,
      )}
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}
