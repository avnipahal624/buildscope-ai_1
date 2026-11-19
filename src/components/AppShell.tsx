import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { deriveNotifications } from "@/lib/insights";
import { initials } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  ChevronLeft,
  FolderKanban,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  PanelLeftClose,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CompassStar, Wordmark } from "@/components/decor/Scenes";
import { ToneIcon } from "@/components/common";

const NAV = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/radar", label: "Hackathon Radar", icon: Radar },
      { to: "/roadmap", label: "Skill Roadmap", icon: BookOpen },
      { to: "/credibility", label: "Credibility Checks", icon: ShieldCheck },
      { to: "/projects", label: "My Projects", icon: FolderKanban },
      { to: "/progress", label: "Progress Hub", icon: BarChart3 },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/library", label: "Research Library", icon: Library },
      { to: "/saved", label: "Saved Opportunities", icon: Bookmark },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

const CONTEXT_ACTION: Record<string, { label: string; to: string }> = {
  "/dashboard": { label: "Find opportunities", to: "/radar" },
  "/radar": { label: "Saved opportunities", to: "/saved" },
  "/roadmap": { label: "Choose a target", to: "/radar" },
  "/credibility": { label: "Run a check", to: "/credibility?run=1" },
  "/projects": { label: "New project", to: "/projects?new=1" },
  "/progress": { label: "Generate report", to: "/progress?report=1" },
  "/library": { label: "Browse the radar", to: "/radar" },
  "/saved": { label: "Browse the radar", to: "/radar" },
  "/settings": { label: "Go to overview", to: "/dashboard" },
  "/profile": { label: "Go to overview", to: "/dashboard" },
};

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 no-scrollbar" aria-label="Main">
      {NAV.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="label-caps mb-2 px-3 text-ivory/40">{group.label}</p>
          )}
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
                        className={cn("size-[1.05rem] shrink-0", isActive ? "text-forest" : "text-ivory/60 group-hover:text-ivory")}
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
          Build smarter.
          <br />
          Aim higher.
        </p>
        <Link
          to="/roadmap"
          className="mt-2 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold"
        >
          Your roadmap <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("buildscope:sidebar") === "collapsed";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const seeded = useRef(false);
  const ensureCatalog = useMutation(api.opportunities.ensureCatalog);

  const opportunities = useQuery(api.opportunities.list);
  const projects = useQuery(api.projects.list);
  const savedRows = useQuery(api.opportunities.saved);
  const roadmap = useQuery(api.roadmap.state);
  const repoChecks = useQuery(api.projects.repoCheckList);

  const notifications = deriveNotifications({
    saved: savedRows ?? [],
    tasks: roadmap?.tasks ?? [],
    projects: (projects ?? []).map((entry) => entry.project),
    repoChecks: repoChecks ?? [],
    onboardingComplete: user?.onboardingComplete,
  });

  // Seed the clearly-labelled demonstration catalogue exactly once per session.
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    void ensureCatalog().catch(() => {
      // A failed seed is non-fatal; the UI shows its empty state.
    });
  }, [ensureCatalog]);

  useEffect(() => {
    const root = document.documentElement;
    if (user?.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [user?.theme]);

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

  const action = CONTEXT_ACTION[location.pathname] ?? { label: "Open radar", to: "/radar" };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "brand-dark fixed inset-y-0 left-0 z-30 hidden flex-col bg-forest text-ivory transition-[width] duration-300 lg:flex",
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
            <p className="mt-0.5 truncate text-xs text-ivory/80">
              {user?.college || "Student workspace"}
            </p>
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

      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95">
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
              <span className="truncate">Search for hackathons, skills, or projects…</span>
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
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="size-[1.15rem]" />
                    {notifications.some((item) => item.tone === "urgent") && (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] border-border bg-card p-0">
                  <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                    <p className="font-display text-base text-forest">Notifications</p>
                    <span className="label-caps text-muted-foreground">Live from your data</span>
                  </div>
                  <ul className="max-h-[320px] divide-y divide-border/60 overflow-y-auto">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.href}
                          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-cream/60"
                        >
                          <span
                            className={cn(
                              "mt-1 size-2 shrink-0 rounded-full",
                              item.tone === "urgent" ? "bg-destructive" : item.tone === "success" ? "bg-sage-deep" : "bg-gold",
                            )}
                            aria-hidden
                          />
                          <span>
                            <span className="block text-xs font-semibold text-forest">{item.title}</span>
                            <span className="mt-0.5 block text-[0.7rem] leading-5 text-muted-foreground">{item.detail}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-cream"
                    aria-label="Profile menu"
                  >
                    <Avatar className="size-9 border border-forest/10">
                      <AvatarFallback className="bg-forest text-[0.7rem] font-semibold text-ivory">
                        {initials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-medium text-forest sm:block">
                      {user?.name?.split(" ")[0] ?? "Student"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border bg-card">
                  <DropdownMenuLabel>
                    <span className="block text-xs font-semibold text-forest">{user?.name ?? "Student"}</span>
                    <span className="block truncate text-[0.65rem] font-normal text-muted-foreground">
                      {user?.email ?? "Signed in"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/progress">Progress report</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 size-4" aria-hidden /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main id="workspace-main" className="mx-auto max-w-[1440px] px-3 pb-14 pt-5 sm:px-5 lg:px-7">
          <Outlet />
        </main>

        <footer className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 pb-8 text-[0.68rem] text-muted-foreground sm:px-7 sm:flex-row sm:items-center sm:justify-between">
          <p>BuildScope AI — discover, prepare, prove.</p>
          <p>Demo catalogue records are labelled and never presented as live listings.</p>
        </footer>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages, opportunities and projects…" />
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
          <CommandGroup heading="Opportunities">
            {(opportunities ?? []).slice(0, 6).map((opportunity) => (
              <CommandItem
                key={opportunity._id}
                value={`${opportunity.name} ${opportunity.domain}`}
                onSelect={() => {
                  navigate(`/radar/${opportunity._id}`);
                  setSearchOpen(false);
                }}
              >
                <Sparkles className="mr-2 size-4 text-gold" aria-hidden />
                <span className="truncate">{opportunity.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {(projects ?? []).slice(0, 6).map(({ project }) => (
              <CommandItem
                key={project._id}
                value={project.name}
                onSelect={() => {
                  navigate(`/projects/${project._id}`);
                  setSearchOpen(false);
                }}
              >
                <FolderKanban className="mr-2 size-4 text-forest/60" aria-hidden />
                <span className="truncate">{project.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-cream/70 px-3 py-2 text-[0.68rem] text-muted-foreground">
              <ToneIcon icon={ShieldCheck} tone="sage" className="size-6" />
              Evidence checks never score a project as stolen from similarity alone.
            </div>
          </div>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
