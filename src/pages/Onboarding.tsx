import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useLightTheme } from "@/hooks/use-light-theme";
import {
  ACADEMIC_YEARS,
  DOMAINS,
  EXPERIENCE_LEVELS,
  INTERESTS,
  SKILL_NAMES,
  STUDENT_GOALS,
} from "@/lib/skills";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, GraduationCap, Loader2, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompassStar, CubeScene } from "@/components/decor/Scenes";
import { Chip, ErrorNote, Field, TagInput } from "@/components/common";

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name so the workspace can greet you."),
  college: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  skills: z.array(z.string()).min(1, "Add at least one skill so matching has something to work with."),
});

const STEPS = [
  { title: "Who you are", caption: "Your student context" },
  { title: "What you know", caption: "Skills you already use" },
  { title: "What pulls you", caption: "Interests and domains" },
  { title: "Where you're going", caption: "Goals and pace" },
];

export default function Onboarding() {
  useLightTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profile.update);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    college: user?.college ?? "",
    branch: user?.branch ?? "",
    academicYear: user?.academicYear ?? "2nd year",
    skills: user?.skills ?? [],
    interests: user?.interests ?? [],
    domains: user?.domains ?? [],
    experienceLevel: user?.experienceLevel ?? "Intermediate",
    goals: user?.goals ?? ["Participate in hackathons"],
    weeklyHours: user?.weeklyHours ?? 6,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleArray = (key: "interests" | "domains" | "goals", value: string) => {
    const current = form[key];
    set(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const skillSuggestions = useMemo(() => SKILL_NAMES.slice(0, 10), []);
  const completion = Math.round(((step + 1) / STEPS.length) * 100);

  const next = () => {
    if (step === 0) {
      if (form.name.trim().length < 2) {
        setError("Add your full name to continue.");
        return;
      }
    }
    if (step === 1 && form.skills.length === 0) {
      setError("Add at least one skill — even “Git & GitHub” counts.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const finish = async () => {
    const parsed = schema.safeParse({
      name: form.name,
      college: form.college,
      branch: form.branch,
      academicYear: form.academicYear,
      skills: form.skills,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please complete the required fields.");
      setStep(parsed.error.issues.some((issue) => issue.path[0] === "name") ? 0 : 1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: form.name.trim(),
        college: form.college.trim() || undefined,
        branch: form.branch.trim() || undefined,
        academicYear: form.academicYear || undefined,
        skills: form.skills,
        interests: form.interests,
        domains: form.domains,
        experienceLevel: form.experienceLevel,
        goals: form.goals,
        weeklyHours: form.weeklyHours,
        onboardingComplete: true,
      });
      toast.success("Profile saved — your radar and roadmap are now personalised.");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative flex flex-col overflow-hidden bg-forest px-6 py-8 text-ivory sm:px-10 lg:min-h-screen">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-gold/40">
            <CompassStar className="size-5 text-gold" />
          </span>
          <div>
            <p className="font-display text-xl leading-none">BuildScope</p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.2em] text-ivory/50">
              Discover. Prepare. Prove.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-12 max-w-md">
          <p className="label-caps text-gold/80">Step {step + 1} of {STEPS.length}</p>
          <h1 className="mt-3 font-display text-3xl leading-[1.08] sm:text-[2.6rem]">
            Let's calibrate your compass.
          </h1>
          <p className="mt-3 text-sm leading-7 text-ivory/65">
            Your answers change which opportunities surface, which skill gaps get prioritised and
            what your dashboard asks you to do next. Optional questions can be skipped.
          </p>

          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-ivory/10">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <ol className="mt-7 space-y-4">
            {STEPS.map((item, index) => (
              <li key={item.title} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[0.62rem]",
                    index < step
                      ? "border-gold bg-gold text-forest-deep"
                      : index === step
                        ? "border-gold text-gold"
                        : "border-ivory/20 text-ivory/40",
                  )}
                >
                  {index < step ? <Check className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <div>
                  <p className={cn("text-sm", index === step ? "text-ivory" : "text-ivory/55")}>{item.title}</p>
                  <p className="text-[0.65rem] text-ivory/35">{item.caption}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative z-10 mt-auto hidden items-end gap-4 pt-10 lg:flex">
          <CubeScene className="h-28 w-32 opacity-90" />
          <p className="max-w-[190px] pb-2 text-[0.65rem] leading-5 text-ivory/40">
            No score is shown until there is real underlying data.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <section className="space-y-5">
                <header>
                  <p className="label-caps text-forest/45">The basics</p>
                  <h2 className="mt-2 flex items-center gap-2 font-display text-3xl text-forest">
                    <GraduationCap className="size-6 text-gold" aria-hidden />
                    Who are we building for?
                  </h2>
                </header>
                <Field label="Full name" htmlFor="name" error={error ?? undefined}>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    placeholder="Avni Pahal"
                    autoComplete="name"
                    className="h-11 bg-card"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="College / university" htmlFor="college" hint="Optional">
                    <Input
                      id="college"
                      value={form.college}
                      onChange={(event) => set("college", event.target.value)}
                      placeholder="Your institution"
                      className="bg-card"
                    />
                  </Field>
                  <Field label="Branch" htmlFor="branch" hint="Optional">
                    <Input
                      id="branch"
                      value={form.branch}
                      onChange={(event) => set("branch", event.target.value)}
                      placeholder="Computer Science"
                      className="bg-card"
                    />
                  </Field>
                </div>
                <Field label="Academic year" htmlFor="year">
                  <select
                    id="year"
                    value={form.academicYear}
                    onChange={(event) => set("academicYear", event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-forest outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {ACADEMIC_YEARS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </Field>
                <p className="rounded-xl bg-cream/70 px-3 py-2 text-[0.7rem] leading-5 text-forest/60">
                  Used only inside your workspace to check eligibility and prioritise preparation.
                </p>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-5">
                <header>
                  <p className="label-caps text-forest/45">Current skills</p>
                  <h2 className="mt-2 font-display text-3xl text-forest">What can you already use?</h2>
                  <p className="mt-2 text-sm leading-6 text-charcoal/60">
                    Be honest — a smaller accurate list produces a more useful roadmap than an
                    aspirational one.
                  </p>
                </header>
                <Field label="Your skills" htmlFor="skills" error={error ?? undefined}>
                  <TagInput
                    id="skills"
                    value={form.skills}
                    onChange={(next) => set("skills", next.slice(0, 24))}
                    placeholder="Type a skill and press Enter"
                    suggestions={skillSuggestions}
                  />
                </Field>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-forest">Add quickly</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SKILL_NAMES.slice(0, 16).map((skill) => (
                      <Chip
                        key={skill}
                        active={form.skills.includes(skill)}
                        onClick={() =>
                          set(
                            "skills",
                            form.skills.includes(skill)
                              ? form.skills.filter((item) => item !== skill)
                              : [...form.skills, skill],
                          )
                        }
                      >
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Field label="Experience level" htmlFor="level">
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <Chip
                        key={level}
                        active={form.experienceLevel === level}
                        onClick={() => set("experienceLevel", level)}
                      >
                        {level}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-5">
                <header>
                  <p className="label-caps text-forest/45">Interests</p>
                  <h2 className="mt-2 flex items-center gap-2 font-display text-3xl text-forest">
                    <Compass className="size-6 text-gold" aria-hidden />
                    What pulls you in?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-charcoal/60">
                    Interests shape recommendations. Preferred domains carry more weight in the
                    match formula.
                  </p>
                </header>
                <div>
                  <p className="label-caps mb-2 text-forest/60">Interests · optional</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <Chip
                        key={interest}
                        active={form.interests.includes(interest)}
                        onClick={() => toggleArray("interests", interest)}
                      >
                        {interest}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-caps mb-2 text-forest/60">Preferred domains</p>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((domain) => (
                      <Chip
                        key={domain}
                        active={form.domains.includes(domain)}
                        onClick={() => toggleArray("domains", domain)}
                      >
                        {domain}
                      </Chip>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <header>
                  <p className="label-caps text-forest/45">Direction</p>
                  <h2 className="mt-2 flex items-center gap-2 font-display text-3xl text-forest">
                    <Target className="size-6 text-gold" aria-hidden />
                    What are you aiming at?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-charcoal/60">
                    Pick the goals that matter now. You can change them later from Profile.
                  </p>
                </header>
                <div>
                  <p className="label-caps mb-2 text-forest/60">Main goals</p>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_GOALS.map((goal) => (
                      <Chip
                        key={goal}
                        active={form.goals.includes(goal)}
                        onClick={() => toggleArray("goals", goal)}
                      >
                        {goal}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Field
                  label={`Weekly preparation time — ${form.weeklyHours}h`}
                  htmlFor="hours"
                  hint="Used to judge whether a deadline leaves enough preparation time."
                >
                  <input
                    id="hours"
                    type="range"
                    min={1}
                    max={20}
                    value={form.weeklyHours}
                    onChange={(event) => set("weeklyHours", Number(event.target.value))}
                    className="mt-1 w-full accent-[#183B2E]"
                  />
                  <div className="flex justify-between text-[0.62rem] text-muted-foreground">
                    <span>1h</span>
                    <span>10h</span>
                    <span>20h</span>
                  </div>
                </Field>
                <div className="rounded-xl border border-sage-deep/50 bg-sage/40 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-forest">
                    <Sparkles className="size-4 text-forest/60" aria-hidden /> What happens next
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[0.72rem] leading-5 text-forest/70">
                    <li>· Your radar ranks opportunities with a visible score breakdown.</li>
                    <li>· The roadmap can turn one opportunity into prioritised tasks.</li>
                    <li>· No achievement or skill mastery is claimed without your evidence.</li>
                  </ul>
                </div>
                {error && <ErrorNote>{error}</ErrorNote>}
              </section>
            )}
          </motion.div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
              className="rounded-full text-forest/70"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {step === 0 ? "Back home" : "Back"}
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && step < STEPS.length - 1 && (
                <Button type="button" variant="ghost" onClick={next} className="rounded-full text-forest/50">
                  Skip optional
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} className="rounded-full bg-forest px-5">
                  Continue <ArrowRight className="size-4" aria-hidden />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={finish}
                  disabled={saving}
                  className="rounded-full bg-forest px-5"
                >
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {saving ? "Building your workspace" : "Enter BuildScope"}
                  {!saving && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
