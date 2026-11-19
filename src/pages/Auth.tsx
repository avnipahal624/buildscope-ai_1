import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useLightTheme } from "@/hooks/use-light-theme";
import { ArrowRight, ArrowUpRight, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArchScene, CompassStar } from "@/components/decor/Scenes";
import { ErrorNote } from "@/components/common";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  useLightTheme();
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send the verification code. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("That code did not work. Check the six digits and try again.");
      setOtp("");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? `Guest sign-in failed: ${err.message}` : "Guest sign-in failed.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-forest px-10 py-9 text-ivory lg:flex">
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-gold/40">
            <CompassStar className="size-5 text-gold" />
          </span>
          <div>
            <p className="font-display text-xl leading-none">BuildScope</p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.2em] text-ivory/50">
              Discover. Prepare. Prove.
            </p>
          </div>
        </Link>

        <div className="relative z-10 mt-14 max-w-md">
          <p className="label-caps text-gold/80">Your student workspace</p>
          <h1 className="mt-3 font-display text-[2.65rem] leading-[1.05]">
            The next opportunity starts with knowing where you stand.
          </h1>
          <p className="mt-4 text-sm leading-7 text-ivory/65">
            Six connected tools — radar, roadmap, projects, evidence checks, library and progress —
            built on one honest record of your work.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-ivory/75">
            {[
              "Matching with a visible, documented formula",
              "Roadmaps generated from your real skill gaps",
              "GitHub evidence read live, limitations included",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                  <Sparkles className="size-2.5" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-auto pt-8">
          <ArchScene className="h-[210px] w-full rounded-2xl opacity-95" />
          <p className="mt-3 flex items-center gap-2 text-[0.65rem] text-ivory/40">
            <ShieldCheck className="size-3.5" aria-hidden />
            Demonstration records are labelled. No fake deadlines, no invented achievements.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <CompassStar className="size-6 text-forest" />
            <span className="font-display text-xl text-forest">BuildScope</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-forest/60 transition-colors hover:text-forest"
          >
            Back to home <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {step === "signIn" ? (
            <>
              <p className="label-caps text-forest/45">Welcome in</p>
              <h2 className="mt-2 font-display text-4xl text-forest">Start where you are.</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/60">
                Sign in with a one-time code. New here? The same form creates your account, then
                asks a few questions to personalise your workspace.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-7 space-y-4">
                <div>
                  <label htmlFor="email" className="label-caps mb-1.5 block text-forest/60">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
                    <Input
                      id="email"
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      className="h-11 bg-card pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                {error && <ErrorNote>{error}</ErrorNote>}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full rounded-full bg-forest text-ivory hover:bg-forest-deep"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {isLoading ? "Sending code" : "Send verification code"}
                  {!isLoading && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="label-caps text-muted-foreground/70">or explore</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-forest/20 bg-card text-forest hover:bg-cream"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                Continue with a guest workspace
              </Button>
              <p className="mt-3 text-center text-[0.68rem] leading-5 text-muted-foreground">
                Guest workspaces are real accounts with a temporary identity — everything you add
                persists.
              </p>
            </>
          ) : (
            <>
              <p className="label-caps text-forest/45">Verification</p>
              <h2 className="mt-2 font-display text-4xl text-forest">Check your inbox.</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/60">
                We sent a six-digit code to <span className="font-medium text-forest">{step.email}</span>.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-7 space-y-4">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />
                <div className="flex justify-center rounded-2xl border border-border bg-card px-4 py-6">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && otp.length === 6 && !isLoading) {
                        const form = (event.target as HTMLElement).closest("form");
                        form?.requestSubmit();
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <ErrorNote>{error}</ErrorNote>}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full bg-forest text-ivory hover:bg-forest-deep"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {isLoading ? "Verifying" : "Verify and enter"}
                  {!isLoading && <ArrowRight className="size-4" aria-hidden />}
                </Button>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="underline-offset-4 hover:text-forest hover:underline"
                    onClick={() => setStep("signIn")}
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    className="underline-offset-4 hover:text-forest hover:underline"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    Continue as guest
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[0.65rem] text-muted-foreground">
          Secured sign-in. BuildScope never posts to GitHub — repository checks are read-only.
        </p>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
