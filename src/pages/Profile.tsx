import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ACADEMIC_YEARS,
  DOMAINS,
  EXPERIENCE_LEVELS,
  INTERESTS,
  SKILL_NAMES,
  STUDENT_GOALS,
} from "@/lib/skills";
import { initials } from "@/lib/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Chip,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
  TagInput,
} from "@/components/common";
import { ArchScene } from "@/components/decor/Scenes";

const schema = z.object({
  name: z.string().trim().min(2, "Your name is required."),
  college: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  academicYear: z.string().min(1),
  experienceLevel: z.string().min(1),
  weeklyHours: z.number().min(1).max(40),
});

type FormValues = z.infer<typeof schema>;

export default function Profile() {
  const { user } = useAuth();
  const overview = useQuery(api.workspace.overview);
  const updateProfile = useMutation(api.profile.update);

  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      college: "",
      branch: "",
      academicYear: "2nd year",
      experienceLevel: "Intermediate",
      weeklyHours: 6,
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name ?? "",
      college: user.college ?? "",
      branch: user.branch ?? "",
      academicYear: user.academicYear ?? "2nd year",
      experienceLevel: user.experienceLevel ?? "Intermediate",
      weeklyHours: user.weeklyHours ?? 6,
    });
    setSkills(user.skills ?? []);
    setInterests(user.interests ?? []);
    setDomains(user.domains ?? []);
    setGoals(user.goals ?? []);
  }, [user, reset]);

  const toggle = (
    list: string[],
    setList: (next: string[]) => void,
    value: string,
  ) => setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await updateProfile({
        name: values.name,
        college: values.college?.trim() || undefined,
        branch: values.branch?.trim() || undefined,
        academicYear: values.academicYear,
        experienceLevel: values.experienceLevel,
        weeklyHours: values.weeklyHours,
        skills,
        interests,
        domains,
        goals,
      });
      toast.success("Profile updated. Matching and roadmap priorities now use these details.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <LoadingBlock label="Loading profile" />;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Profile"
        title={
          <>
            {user.name ?? "Your profile"}
            <span className="ml-2 align-middle text-gold">✦</span>
          </>
        }
        description="Your profile is the input to matching, eligibility checks and roadmap priorities. Keep it accurate rather than aspirational."
        actions={
          <>
            {user.college && <Tag tone="cream">{user.college}</Tag>}
            {user.branch && <Tag tone="sage">{user.branch}</Tag>}
            {user.academicYear && <Tag tone="lavender">{user.academicYear}</Tag>}
          </>
        }
        aside={
          <div className="hidden items-center gap-3 lg:flex">
            <ArchScene className="h-[130px] w-[190px] rounded-2xl" />
            <Avatar className="size-16 border-4 border-card shadow-lg">
              <AvatarFallback className="bg-forest text-lg text-ivory">{initials(user.name)}</AvatarFallback>
            </Avatar>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SectionCard title="Personal details" icon={User}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="profile-name" error={errors.name?.message}>
                <Input id="profile-name" {...register("name")} className="bg-ivory/60" />
              </Field>
              <Field label="College / university" htmlFor="profile-college">
                <Input id="profile-college" {...register("college")} className="bg-ivory/60" />
              </Field>
              <Field label="Branch" htmlFor="profile-branch">
                <Input id="profile-branch" {...register("branch")} placeholder="Computer Science" className="bg-ivory/60" />
              </Field>
              <Field label="Academic year" htmlFor="profile-year">
                <select id="profile-year" {...register("academicYear")} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest">
                  {ACADEMIC_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </Field>
              <Field label="Experience level" htmlFor="profile-level">
                <select id="profile-level" {...register("experienceLevel")} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest">
                  {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </Field>
              <Field label="Preparation hours / week" htmlFor="profile-hours" error={errors.weeklyHours?.message}>
                <Input id="profile-hours" type="number" min={1} max={40} {...register("weeklyHours", { valueAsNumber: true })} className="bg-ivory/60" />
              </Field>
            </div>
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              Email: {user.email ?? "guest workspace"} · used for sign-in only.
            </p>
          </SectionCard>

          <SectionCard title="Skills" icon={Sparkles} eyebrow="Be precise">
            <TagInput
              value={skills}
              onChange={setSkills}
              placeholder="Add a skill and press Enter"
              suggestions={SKILL_NAMES.slice(0, 10)}
            />
            <InfoNote tone="cream">
              Skills drive the match formula and roadmap gaps. Listing a skill is not a claim of
              mastery; evidence is a separate check.
            </InfoNote>
          </SectionCard>

          <SectionCard title="Interests & domains" icon={Sparkles}>
            <div>
              <p className="label-caps mb-1.5 text-forest/45">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((interest) => (
                  <Chip key={interest} active={interests.includes(interest)} onClick={() => toggle(interests, setInterests, interest)}>
                    {interest}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="label-caps mb-1.5 text-forest/45">Preferred domains (20 match points)</p>
              <div className="flex flex-wrap gap-1.5">
                {DOMAINS.map((domain) => (
                  <Chip key={domain} active={domains.includes(domain)} onClick={() => toggle(domains, setDomains, domain)}>
                    {domain}
                  </Chip>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Goals" icon={Sparkles}>
            <div className="flex flex-wrap gap-1.5">
              {STUDENT_GOALS.map((goal) => (
                <Chip key={goal} active={goals.includes(goal)} onClick={() => toggle(goals, setGoals, goal)}>
                  {goal}
                </Chip>
              ))}
            </div>
          </SectionCard>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={saving} className="rounded-full bg-forest px-5">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
              {saving ? "Saving profile" : "Save profile"}
            </Button>
          </div>
          {isDirty && <p className="text-right text-[0.65rem] text-muted-foreground">Unsaved text changes</p>}
        </form>

        <aside className="space-y-4">
          <SectionCard title="Your record" icon={User}>
            <ul className="space-y-2 text-[0.72rem]">
              {[
                { label: "Skills listed", value: skills.length },
                { label: "Saved opportunities", value: overview?.saved.length ?? 0 },
                { label: "Projects", value: overview?.projects.length ?? 0 },
                { label: "Roadmap tasks", value: overview?.tasks.length ?? 0 },
                { label: "Evidence checks", value: overview?.evidence.length ?? 0 },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="tnum font-display text-lg text-forest">{row.value}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl bg-forest p-5 text-ivory">
            <p className="label-caps text-gold/80">Profile completeness</p>
            <p className="mt-2 font-display text-2xl leading-tight">
              {[
                user.name,
                user.college,
                user.branch,
                user.academicYear,
                skills.length > 0 ? "skills" : "",
                domains.length > 0 ? "domains" : "",
                goals.length > 0 ? "goals" : "",
              ].filter(Boolean).length}
              /7
            </p>
            <p className="mt-1 text-[0.68rem] leading-5 text-ivory/60">
              Complete fields improve the signal behind recommendations. Nothing is scored for
              completeness itself.
            </p>
            <div className="pointer-events-none absolute -bottom-5 -right-5 size-24 rounded-full border border-gold/20" aria-hidden />
          </div>

          <SectionCard title="How this is used" icon={Sparkles}>
            <ul className="space-y-1.5 text-[0.68rem] leading-5 text-muted-foreground">
              <li>· Skills and domains feed the documented match formula.</li>
              <li>· Academic year checks eligibility on each opportunity.</li>
              <li>· Weekly hours judge whether a deadline leaves enough preparation time.</li>
              <li>· Goals guide the next-move suggestions on your overview.</li>
            </ul>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
