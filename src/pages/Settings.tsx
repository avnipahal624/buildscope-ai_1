import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { DOMAINS } from "@/lib/skills";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Download,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Save,
  Sun,
  Trash2,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Chip,
  ConfirmButton,
  Field,
  InfoNote,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profile.update);
  const data = useQuery(api.workspace.exportAll);

  const [prefs, setPrefs] = useState({
    deadlines: true,
    roadmap: true,
    weeklyDigest: false,
  });
  const [domains, setDomains] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPrefs({
      deadlines: user.notificationPrefs?.deadlines ?? true,
      roadmap: user.notificationPrefs?.roadmap ?? true,
      weeklyDigest: user.notificationPrefs?.weeklyDigest ?? false,
    });
    setDomains(user.domains ?? []);
    setWeeklyHours(user.weeklyHours ?? 6);
    setTheme(user.theme === "dark" ? "dark" : "light");
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        notificationPrefs: prefs,
        domains,
        weeklyHours,
        theme,
      });
      document.documentElement.classList.toggle("dark", theme === "dark");
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const downloadData = () => {
    if (!data) {
      toast.error("Your export is still loading. Try again in a moment.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `buildscope-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded.");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Settings"
        title={
          <>
            Preferences, not
            <br />
            <span className="italic text-forest/60">more noise.</span>
          </>
        }
        description="Control how the workspace behaves. Preferences are stored with your profile. Email delivery is not wired in this MVP, so notification settings only affect in-app signals."
        actions={
          <Button size="sm" onClick={() => void save()} disabled={saving} className="rounded-full bg-forest">
            {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
            {saving ? "Saving" : "Save preferences"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Notifications" icon={Bell} eyebrow="In-app signals">
          <div className="space-y-3">
            {[
              { key: "deadlines" as const, label: "Deadline reminders", detail: "Show saved opportunities closing within 21 days." },
              { key: "roadmap" as const, label: "Roadmap nudges", detail: "Show tasks currently in progress." },
              { key: "weeklyDigest" as const, label: "Weekly digest", detail: "Stored preference only — no email is sent in this MVP." },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-cream/25 px-3 py-2.5">
                <div>
                  <p className="text-[0.78rem] font-medium text-forest">{item.label}</p>
                  <p className="text-[0.65rem] leading-4 text-muted-foreground">{item.detail}</p>
                </div>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={(checked) => setPrefs((current) => ({ ...current, [item.key]: checked }))}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>
          <InfoNote tone="cream">
            BuildScope does not send email or push notifications yet. The bell shows live signals
            computed from your own records.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Appearance" icon={Palette} eyebrow="Theme preference">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { key: "light" as const, label: "Warm ivory", icon: Sun, detail: "The default editorial workspace." },
              { key: "dark" as const, label: "Forest night", icon: Moon, detail: "Low-light deep green palette." },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTheme(option.key)}
                aria-pressed={theme === option.key}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  theme === option.key
                    ? "border-forest/40 bg-sage/40"
                    : "border-border bg-cream/25 hover:border-forest/20"
                }`}
              >
                <option.icon className="size-4 text-forest/60" aria-hidden />
                <p className="mt-2 text-[0.78rem] font-medium text-forest">{option.label}</p>
                <p className="mt-0.5 text-[0.62rem] leading-4 text-muted-foreground">{option.detail}</p>
              </button>
            ))}
          </div>
          <Field label="Preparation hours / week" htmlFor="settings-hours" hint="Used in the preparation-time component of matching." className="mt-3">
            <input
              id="settings-hours"
              type="range"
              min={1}
              max={20}
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(Number(event.target.value))}
              className="w-full accent-[#183B2E]"
            />
            <span className="tnum text-xs text-forest">{weeklyHours}h / week</span>
          </Field>
          <p className="mt-2 text-[0.62rem] text-muted-foreground">
            Theme is applied when you save, and only to this device.
          </p>
        </SectionCard>

        <SectionCard title="Opportunity preferences" icon={UserCog} eyebrow="Default filters">
          <p className="mb-2 text-[0.7rem] leading-5 text-muted-foreground">
            Preferred domains carry 20 points in the match formula and are also used as your default
            domain emphasis on the radar.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map((domain) => (
              <Chip
                key={domain}
                active={domains.includes(domain)}
                onClick={() =>
                  setDomains((current) =>
                    current.includes(domain)
                      ? current.filter((item) => item !== domain)
                      : [...current, domain],
                  )
                }
              >
                {domain}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="sage">Eligibility checked against {user?.academicYear ?? "your year"}</Tag>
            <Tag tone="cream">Demo catalogue labelled</Tag>
          </div>
        </SectionCard>

        <SectionCard title="Account" icon={UserCog} eyebrow="Signed in">
          <dl className="space-y-2 text-[0.72rem]">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Name</dt><dd className="text-forest">{user?.name ?? "Guest workspace"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="truncate text-forest">{user?.email ?? "Anonymous"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Student profile</dt><dd className="text-forest">{user?.onboardingComplete ? "Complete" : "Incomplete"}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full text-[0.68rem]" onClick={downloadData}>
              <Download className="size-3.5" aria-hidden /> Export my data
            </Button>
            <ConfirmButton
              title="Sign out of BuildScope?"
              description="Your data stays in your account. You can sign back in with the same email or guest session."
              confirmLabel="Sign out"
              onConfirm={() => void handleSignOut()}
              variant="ghost"
              className="text-[0.68rem] text-forest/60"
            >
              <LogOut className="size-3.5" aria-hidden /> Sign out (confirm)
            </ConfirmButton>
          </div>
          <InfoNote tone="cream">
            Export includes your profile, projects, milestones, roadmap, saved opportunities,
            repository checks, library and activity. API keys and auth tokens are never included.
          </InfoNote>
        </SectionCard>
      </div>

      <SectionCard title="Data honesty" icon={Trash2} eyebrow="What BuildScope does not do">
        <ul className="space-y-1.5 text-[0.7rem] leading-5 text-muted-foreground">
          <li>· It does not fabricate opportunities, deadlines, prize pools or official links.</li>
          <li>· It does not auto-award achievements or claim skill mastery.</li>
          <li>· It does not score code similarity or AST similarity — those checks are Not assessed.</li>
          <li>· It does not call a repository stolen based on similarity or fork status.</li>
          <li>· It does not send email notifications in this MVP.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
