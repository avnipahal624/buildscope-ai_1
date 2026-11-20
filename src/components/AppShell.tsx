import { cn } from "@/lib/utils";
import { api, errorMessage } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import {
  ArrowUpRight,
  BookOpenCheck,
  ChevronLeft,
  CircleHelp,
  Compass,
  FolderKanban,
  GitCompareArrows,
  Github,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  Radar,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sun,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CompassStar, Wordmark } from "@/components/decor/Scenes";
import { ToneIcon } from "@/components/common";

const NAV = [
  {
    label: "Research",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/radar", label: "Hackathon Radar", icon: Radar },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/prior-art", label: "Prior Art Lab", icon: Github },
      { to: "/similarity", label: "Similarity Intelligence", icon: TrendingUp },
      { to: "/competitors", label: "Competitor Analysis", icon: GitCompareArrows },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/progress", label: "Research Progress", icon: TrendingUp },
      { to: "/method", label: "Method & Limits", icon: BookOpenCheck },
      { to: "/evidence", label: "Evidence Ledger", icon: ShieldCheck },
      { to: "/validation", label: "Problem Validation", icon: CircleHelp },
    ],
  },
];

const CONTEXT_ACTION: Record<string, { label: string; to: string }> = {
  "/dashboard": { label: "Open projects", to: "/projects" },
  "/radar": { label: "Search live listings", to: "/radar?search=1" },
  "/projects": { label: "New project", to: "/projects?new=1" },
  "/prior-art": { label: "Search repositories", to: "/prior-art?search=1" },
  "/progress": { label: "Open a project", to: "/projects" },
  "/method": { label: "Back to overview", to: "/dashboard" },
};

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 no-scrollbar" aria-label="Main">
      {NAV.map((group) => (
        <div key={group.label}>
          {!collapsed && <p className="label-caps mb-2 px-3 text-ivory/40">{group.label}</p>}
          {collapsed && <div className="mx-2 mb-2 h-px bg-ivory/10" aria-hidden />}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-full px-3 py-2 text-[0.82rem] transition-colors",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-sage text-forest-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "size-[1.05rem] shrink-0",
                          isActive ? "text-forest" : "text-ivory/60 group-hover:text-ivory",
                        )}
                        aria-hidden
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="grid place-items-center pb-5">
        <CompassStar className="size-5 text-gold/80" />
      </div>
    );
  }
  return (
    <div className="relative mx-3 mb-4 overflow-hidden rounded-2xl border border-ivory/10 bg-forest-deep/70 px-4 pb-3 pt-4">
      <svg viewBox="0 0 200 90" className="absolute inset-x-0 bottom-0 h-16 w-full opacity-45" aria-hidden>
        <path d="M0 80c30-34 52-30 76-12 22 16 40 10 60-6 24-20 44-16 64 2v26H0Z" fill="#23503F" />
        <path d="M120 90c0-22 12-38 28-38s28 16 28 38Z" fill="#DCE8D3" opacity="0.25" />
        <circle cx="168" cy="34" r="12" fill="#D5B77A" opacity="0.5" />
      </svg>
      <div className="relative">
        <p className="font-display text-[1.05rem] leading-snug text-ivory">
          Investigate first.
          <br />
          Build with evidence.
        </p>
        <Link
          to="/method"
          className="mt-2 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold"
        >
          How evidence works <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("buildscope:sidebar") === "collapsed";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("buildscope:theme") === "dark" ? "dark" : "light";
  });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const projects = useResource((signal) => api.listProjects(signal), []);
  const health = useResource((signal) => api.health(signal), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("buildscope:theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("buildscope:sidebar", next ? "collapsed" : "open");
      return next;
    });
  };

  const action = CONTEXT_ACTION[location.pathname] ?? { label: "Open projects", to: "/projects" };
  const apiOnline = health.data?.status === "ok" && !health.error;

  const token = typeof window !== "undefined" ? window.localStorage.getItem("buildscope:token") : null;
  if (!token) {
    const submitAuth = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthBusy(true); setAuthError("");
      try {
        const session = authMode === "login" ? await api.login(authEmail, authPassword) : await api.register(authEmail, authPassword);
        window.localStorage.setItem("buildscope:token", session.access_token);
        window.location.reload();
      } catch (error) {
        setAuthError(errorMessage(error));
      } finally { setAuthBusy(false); }
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form onSubmit={submitAuth} className="paper w-full max-w-md space-y-5 rounded-3xl p-7 shadow-sm">
          <div><p className="label-caps text-forest/50">Private workspace</p><h1 className="mt-2 font-display text-3xl text-forest">{authMode === "login" ? "Sign in to BuildScope" : "Create your BuildScope account"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Your investigations are isolated to your account.</p></div>
          <label className="block text-sm">Email<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2" /></label>
          <label className="block text-sm">Password<input required minLength={8} type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2" /></label>
          {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
          <button disabled={authBusy} className="w-full rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-ivory disabled:opacity-60">{authBusy ? "Working…" : authMode === "login" ? "Sign in" : "Create account"}</button>
          <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-sm text-forest underline underline-offset-4">{authMode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "brand-dark print-hide fixed inset-y-0 left-0 z-30 hidden flex-col bg-forest text-ivory transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        <div className={cn("flex items-center justify-between px-4 pb-6 pt-5", collapsed && "justify-center px-2")}>
          {collapsed ? (
            <Link to="/dashboard" aria-label="BuildScope overview">
              <span className="grid size-10 place-items-center rounded-full border border-gold/40">
                <CompassStar className="size-6 text-gold" />
              </span>
            </Link>
          ) : (
            <Link to="/dashboard" aria-label="BuildScope overview">
              <Wordmark />
            </Link>
          )}
        </div>

        {!collapsed && (
          <div className="mx-4 mb-5 rounded-xl border border-ivory/10 bg-forest-deep/60 px-3 py-2">
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ivory/45">Workspace</p>
            <p className="mt-0.5 truncate text-xs text-ivory/80">Shared research service</p>
          </div>
        )}

        <NavItems collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mx-3 mb-3 flex items-center gap-2 rounded-full px-3 py-2 text-[0.7rem] text-ivory/50 transition-colors hover:bg-ivory/10 hover:text-ivory",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronLeft className="size-4 rotate-180" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <div
        className={cn(
          "transition-[padding] duration-300 print:pl-0",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]",
        )}
      >
        <header className="print-hide sticky top-0 z-20 border-b border-border/60 bg-background/95">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-7">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="brand-dark w-[280px] border-none bg-forest p-0 text-ivory">
                <SheetTitle className="sr-only">BuildScope navigation</SheetTitle>
                <div className="px-5 pb-4 pt-6">
                  <Wordmark />
                </div>
                <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter collapsed={false} />
              </SheetContent>
            </Sheet>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-forest/25 sm:max-w-[420px]"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Search pages and projects…</span>
              <kbd className="ml-auto hidden rounded border border-border bg-cream px-1.5 py-0.5 text-[0.6rem] text-muted-foreground sm:block">
                ⌘ K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Button asChild size="sm" className="hidden rounded-full md:inline-flex">
                <Link to={action.to}>{action.label}</Link>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={apiOnline ? "Research API connected" : "Research API status"}
                  >
                    {apiOnline ? <Wifi className="size-[1.1rem]" /> : <WifiOff className="size-[1.1rem]" />}
                    <span
                      className={cn(
                        "absolute right-2 top-2 size-2 rounded-full ring-2 ring-background",
                        health.loading ? "bg-gold" : apiOnline ? "bg-sage-deep" : "bg-destructive",
                      )}
                      aria-hidden
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[310px] border-border bg-card p-0">
                  <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                    <Server className="size-4 text-forest/60" aria-hidden />
                    <p className="font-display text-base text-forest">FastAPI connection</p>
                  </div>
                  <div className="space-y-2 px-4 py-3 text-[0.72rem] leading-5">
                    <p className={cn("font-medium", apiOnline ? "text-forest" : "text-destructive")}>
                      {health.loading
                        ? "Checking the research service…"
                        : apiOnline
                          ? "Connected"
                          : "Not reachable right now"}
                    </p>
                    <p className="text-muted-foreground">
                      Projects, research jobs, evidence, prior art and proof-chain checks come from
                      the existing FastAPI service.
                    </p>
                    {health.error && <p className="text-destructive">{health.error}</p>}
                    <p className="rounded-lg bg-cream/70 px-2.5 py-2 text-[0.65rem] leading-4 text-forest/60">
                      The deployed API is shared and currently has no account system. Treat projects
                      as a public workspace.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full"
                      onClick={health.reload}
                    >
                      <RefreshCw className={cn("size-3.5", health.loading && "animate-spin")} aria-hidden />
                      Check again
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
              >
                {theme === "dark" ? <Sun className="size-[1.1rem]" /> : <Moon className="size-[1.1rem]" />}
              </Button>

              <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Method and limits">
                <Link to="/method">
                  <CircleHelp className="size-[1.1rem]" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main id="workspace-main" className="mx-auto max-w-[1440px] px-3 pb-14 pt-5 sm:px-5 lg:px-7 print:max-w-none print:p-0">
          <Outlet />
        </main>

        <footer className="print-hide mx-auto flex max-w-[1440px] flex-col gap-2 px-4 pb-8 text-[0.68rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p>BuildScope AI — investigate, validate, build, prove.</p>
          <p>Research runs on the existing FastAPI service. No accounts are available in this backend version.</p>
        </footer>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages and projects…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Workspace">
            {NAV.flatMap((group) => group.items).map((item) => (
              <CommandItem
                key={item.to}
                value={`${item.label} ${item.to}`}
                onSelect={() => {
                  navigate(item.to);
                  setSearchOpen(false);
                }}
              >
                <item.icon className="mr-2 size-4 text-forest/60" aria-hidden />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Projects">
            {(projects.data ?? []).map((project) => (
              <CommandItem
                key={project.id}
                value={`${project.name} ${project.keywords.join(" ")}`}
                onSelect={() => {
                  navigate(`/projects/${project.id}`);
                  setSearchOpen(false);
                }}
              >
                <FolderKanban className="mr-2 size-4 text-forest/60" aria-hidden />
                <span className="truncate">{project.name}</span>
              </CommandItem>
            ))}
            {!projects.loading && (projects.data ?? []).length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No projects yet.</div>
            )}
          </CommandGroup>
          <CommandSeparator />
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-cream/70 px-3 py-2 text-[0.68rem] text-muted-foreground">
              <ToneIcon icon={Compass} tone="sage" className="size-6" />
              Similarity signals prioritise research. They never prove originality.
            </div>
          </div>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
