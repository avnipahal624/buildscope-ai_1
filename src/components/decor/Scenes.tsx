import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * All 3D visuals are CSS transforms and inline SVG — no WebGL, no image assets.
 * They animate only transform/opacity and are disabled by prefers-reduced-motion.
 */

export function CompassStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <path
        d="M24 2.5c1.4 8.9 3.4 13.6 7.3 16.9 3.3 2.8 8 4.1 14.2 4.6-6.2.5-10.9 1.8-14.2 4.6-3.9 3.3-5.9 8-7.3 16.9-1.4-8.9-3.4-13.6-7.3-16.9C13.4 25.8 8.7 24.5 2.5 24c6.2-.5 10.9-1.8 14.2-4.6C20.6 16.1 22.6 11.4 24 2.5Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="2.6" fill="#D5B77A" />
    </svg>
  );
}

export function Wordmark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-forest-soft/60">
        <CompassStar className="size-5 text-gold" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-[1.35rem] text-ivory">BuildScope</p>
          <p className="text-[0.6rem] tracking-[0.19em] uppercase text-ivory/55">
            Discover. Prepare. Prove.
          </p>
        </div>
      )}
    </div>
  );
}

export function Tilt({
  children,
  className,
  strength = 8,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty("--ry", `${x * strength}deg`);
        node.style.setProperty("--rx", `${-y * strength}deg`);
        node.style.setProperty("--tz", "6px");
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--tz", "0px");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={cn("tilt preserve", className)}>
      {children}
    </div>
  );
}

/** Editorial arch / pathway composition used across the product. */
export function ArchScene({ className }: { className?: string }) {
  return (
    <div className={cn("stage-wide relative select-none", className)} aria-hidden>
      <svg viewBox="0 0 620 430" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1E9DC" />
            <stop offset="100%" stopColor="#F8F3EA" />
          </linearGradient>
          <linearGradient id="portal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F6D1BE" />
            <stop offset="55%" stopColor="#E8DDF2" />
            <stop offset="100%" stopColor="#DCE8D3" />
          </linearGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2C5C49" />
            <stop offset="100%" stopColor="#183B2E" />
          </linearGradient>
          <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DCE8D3" />
            <stop offset="100%" stopColor="#C9D9BC" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F6D1BE" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F6D1BE" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="620" height="430" fill="url(#sky)" rx="28" />
        <circle cx="430" cy="140" r="130" fill="url(#sun)" />

        {/* checkered motif */}
        <g opacity="0.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <rect
              key={index}
              x={470 + (index % 4) * 16}
              y={26 + Math.floor(index / 4) * 16}
              width="16"
              height="16"
              fill={index % 2 === 0 ? "#183B2E" : "transparent"}
              stroke="#183B2E"
              strokeOpacity="0.25"
            />
          ))}
        </g>

        {/* hills */}
        <path
          d="M-20 330c70-52 132-58 208-24 62 28 108 20 160-12 84-52 168-46 292 26v130H-20Z"
          fill="url(#hill)"
        />
        <path
          d="M-20 372c96-40 170-16 248 10 90 30 158 12 232-22 52-24 108-18 180 12v78H-20Z"
          fill="#B9D0AD"
          opacity="0.75"
        />

        {/* arch plinth */}
        <g>
          <ellipse cx="330" cy="372" rx="176" ry="20" fill="#102C23" opacity="0.12" />
          <path d="M196 352h268v22H196z" fill="#DCE8D3" />
          <path d="M214 336h232v18H214z" fill="#F1E9DC" />
          <path d="M178 300c0-96 62-172 152-172s152 76 152 172h-44c0-76-46-132-108-132s-108 56-108 132Z" fill="url(#wall)" />
          <path d="M246 300c0-62 36-110 84-110s84 48 84 110Z" fill="url(#portal)" />
          <path d="M246 300c0-62 36-110 84-110s84 48 84 110" fill="none" stroke="#D5B77A" strokeWidth="2" opacity="0.7" />
          <path d="M330 196v104" stroke="#D5B77A" strokeWidth="1.5" opacity="0.4" />
          <path d="M178 300h304v10H178z" fill="#102C23" opacity="0.4" />
          <path d="M156 384h348v12H156z" fill="#F8F3EA" />
          <path d="M132 396h396v10H132z" fill="#DCE8D3" />
          {/* columns */}
          <rect x="196" y="262" width="16" height="44" rx="3" fill="#23503F" />
          <rect x="448" y="262" width="16" height="44" rx="3" fill="#23503F" />
        </g>

        {/* pathway */}
        <path d="M300 430c6-28 14-44 30-44s24 16 30 44Z" fill="#F8F3EA" opacity="0.6" />

        {/* botanical sprigs */}
        <g stroke="#183B2E" strokeWidth="1.4" fill="none" opacity="0.45">
          <path d="M96 356c-12-34-2-62 26-84" />
          <path d="M108 330c-14-4-20-14-22-26 14 2 22 12 22 26Z" fill="#DCE8D3" />
          <path d="M114 312c10-12 22-14 34-10-8 12-20 16-34 10Z" fill="#DCE8D3" />
        </g>
        <g stroke="#D5B77A" strokeWidth="1.2" fill="none" opacity="0.7">
          <path d="M498 344c10-26 26-40 48-46" />
          <path d="M514 322c-2-12 2-22 12-28 4 12 0 22-12 28Z" fill="#F6D1BE" />
        </g>
      </svg>

      {/* floating 3D medals */}
      <div className="pointer-events-none absolute inset-0">
        <div className="float-y absolute left-[13%] top-[16%] size-9 rounded-xl border border-gold/50 bg-ivory/80 shadow-float" style={{ transform: "rotateX(24deg) rotateY(-28deg)" }} />
        <div className="float-y-slow absolute right-[16%] top-[24%] grid size-12 place-items-center rounded-full border border-gold/40 bg-forest/90 shadow-float">
          <CompassStar className="size-6 text-gold" />
        </div>
        <div className="twinkle absolute left-[30%] top-[10%] size-2.5 rounded-full bg-gold" />
        <div className="twinkle absolute right-[34%] bottom-[26%] size-2 rounded-full bg-peach-deep" style={{ animationDelay: "1.2s" }} />
      </div>
    </div>
  );
}

/** CSS-built laptop with a little floating scope mark. */
export function LaptopScene({ className }: { className?: string }) {
  return (
    <div className={cn("stage relative h-[170px] w-[240px]", className)} aria-hidden>
      <div className="preserve absolute inset-0" style={{ transform: "rotateX(14deg) rotateY(-16deg)" }}>
        <div className="absolute left-1/2 top-3 h-[120px] w-[196px] -translate-x-1/2 rounded-[10px] border border-gold/30 bg-forest-deep p-2 shadow-float">
          <div className="h-full rounded-[6px] border border-ivory/10 bg-[#0B241C] p-3">
            <div className="mb-2 flex gap-1">
              <span className="size-1.5 rounded-full bg-peach" />
              <span className="size-1.5 rounded-full bg-gold" />
              <span className="size-1.5 rounded-full bg-sage" />
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-2/3 rounded-full bg-sage/50" />
              <div className="h-1.5 w-1/2 rounded-full bg-gold/40" />
              <div className="h-1.5 w-4/5 rounded-full bg-ivory/20" />
              <div className="h-1.5 w-1/3 rounded-full bg-peach/40" />
              <div className="mt-3 h-6 w-24 rounded border border-gold/30 bg-forest/60" />
            </div>
          </div>
        </div>
        <div
          className="absolute left-1/2 top-[142px] h-[34px] w-[228px] -translate-x-1/2 rounded-b-[14px] border border-gold/25 bg-gradient-to-b from-[#2C5C49] to-[#183B2E]"
          style={{ transform: "rotateX(62deg)", transformOrigin: "top center" }}
        >
          <div className="mx-auto mt-1 h-1 w-16 rounded-full bg-ivory/25" />
        </div>
        <div className="absolute left-1/2 top-[150px] h-3 w-[150px] -translate-x-1/2 rounded-full bg-forest-deep/25 blur-md" />
      </div>
      <div className="float-y absolute -right-2 top-0 grid size-11 place-items-center rounded-full border border-gold/40 bg-ivory/90 shadow-float">
        <CompassStar className="size-6 text-forest" />
      </div>
      <span className="twinkle absolute -left-2 bottom-6 size-2 rounded-full bg-gold" />
    </div>
  );
}

/** Concentric compass rings — used for preparation and progress scores. */
export function CompassOrb({ className, value = 0 }: { className?: string; value?: number }) {
  const angle = Math.round((value / 100) * 360);
  return (
    <div className={cn("stage relative grid place-items-center", className)} aria-hidden>
      <div className="preserve relative size-full">
        <div className="absolute inset-0 rounded-full border border-forest/15" style={{ transform: "rotateX(64deg)" }} />
        <div className="absolute inset-[14%] rounded-full border border-forest/25" style={{ transform: "rotateX(68deg) rotateZ(12deg)" }} />
        <div className="absolute inset-[28%] rounded-full border border-dashed border-gold/50" style={{ transform: "rotateX(58deg) rotateZ(-10deg)" }} />
        <div
          className="absolute inset-[18%] rounded-full"
          style={{
            transform: "rotateX(66deg)",
            background: `conic-gradient(from -90deg, #183B2E 0deg ${angle}deg, rgba(24,59,46,0.10) ${angle}deg 360deg)`,
            maskImage: "radial-gradient(circle, transparent 62%, black 63%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 62%, black 63%)",
          }}
        />
        <div className="absolute left-1/2 top-1/2 grid size-[46%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/40 bg-ivory/90 shadow-float">
          <CompassStar className="size-1/2 text-forest" />
        </div>
      </div>
    </div>
  );
}

/** Small 3D book stack for library / empty states. */
export function BookScene({ className }: { className?: string }) {
  const books = [
    { color: "#183B2E", width: "w-32", label: "SCOPE" },
    { color: "#F6D1BE", width: "w-28", label: "BUILD" },
    { color: "#E8DDF2", width: "w-24", label: "PROVE" },
  ];
  return (
    <div className={cn("stage grid place-items-center", className)} aria-hidden>
      <div className="preserve flex flex-col items-center gap-1" style={{ transform: "rotateX(52deg) rotateZ(-28deg)" }}>
        {books.map((book, index) => (
          <div
            key={book.label}
            className={cn("h-7 rounded-[4px] border border-forest/20 px-3 text-[0.55rem] leading-7 tracking-[0.2em]", book.width)}
            style={{
              backgroundColor: book.color,
              color: index === 0 ? "#F8F3EA" : "#183B2E",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.35), 0 10px 16px -12px rgba(16,44,35,0.6)",
              transform: `translateZ(${index * 4}px)`,
            }}
          >
            {book.label}
          </div>
        ))}
        <span className="mt-1 size-2 rounded-full bg-gold" />
      </div>
    </div>
  );
}

/** Isometric cube cluster for credibility / empty states. */
export function CubeScene({ className }: { className?: string }) {
  const cube = (size: number, x: number, y: number, z: number, tone: "forest" | "peach" | "sage", delay: string) => (
    <div
      key={`${tone}-${x}-${y}`}
      className="absolute"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        transform: `translateZ(${z}px)`,
        animationDelay: delay,
      }}
    >
      <div
        className="absolute inset-0 rounded-[3px]"
        style={{
          background: tone === "forest" ? "#23503F" : tone === "peach" ? "#F6D1BE" : "#DCE8D3",
          transform: "translateZ(0)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-1/3 origin-top rounded-[3px]"
        style={{
          background: tone === "forest" ? "#2C5C49" : tone === "peach" ? "#FBE3D7" : "#E7F0DF",
          transform: "rotateX(60deg)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-1/4 origin-right rounded-[3px]"
        style={{
          background: tone === "forest" ? "#183B2E" : tone === "peach" ? "#EEB99E" : "#B9D0AD",
          transform: "rotateY(-60deg)",
        }}
      />
    </div>
  );

  return (
    <div className={cn("stage grid place-items-center", className)} aria-hidden>
      <div className="preserve relative size-32" style={{ transform: "rotateX(56deg) rotateZ(-42deg)" }}>
        <div className="float-y absolute left-2 top-6">{cube(34, 0, 0, 0, "forest", "0s")}</div>
        <div className="float-y-slow absolute left-16 top-0">{cube(26, 0, 0, 8, "peach", "0.6s")}</div>
        <div className="float-y absolute left-14 top-16">{cube(30, 0, 0, 4, "sage", "1.1s")}</div>
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
