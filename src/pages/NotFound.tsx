import { useLightTheme } from "@/hooks/use-light-theme";
import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { CompassStar } from "@/components/decor/Scenes";

export default function NotFound() {
  useLightTheme();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ivory px-4 py-16">
      <div className="absolute inset-0 grain opacity-60" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-forest/10" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-forest/10" aria-hidden />
      <div className="relative max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-forest">
          <CompassStar className="size-9 text-gold" />
        </span>
        <p className="label-caps mt-6 text-forest/45">Off the map</p>
        <h1 className="mt-2 font-display text-5xl text-forest">404</h1>
        <p className="mt-2 text-sm leading-6 text-charcoal/60">
          This page is not part of your workspace. The compass still works — head back to something
          real.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-full bg-forest">
            <Link to="/dashboard">
              <Compass className="size-4" aria-hidden /> Open overview
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-forest/20 bg-card text-forest">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden /> Back home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
