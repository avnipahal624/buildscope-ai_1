/**
 * Demonstration opportunity catalogue.
 *
 * Every record here is a fabricated DEMONSTRATION listing. It deliberately has
 * no `sourceUrl`, a `dataStatus` of "demo" and a `sourceLabel` that says so.
 * BuildScope never presents these as live hackathons, and the UI labels them
 * accordingly in the radar, detail page, recommendations and saved lists.
 */
export type DemoOpportunity = {
  slug: string;
  name: string;
  organiser: string;
  description: string;
  domain: string;
  format: "online" | "offline" | "hybrid";
  location: string;
  registrationDeadline: number;
  startDate: number;
  endDate: number;
  skillsRequired: string[];
  eligibility: string;
  minYear?: string;
  prizeRange?: string;
  sourceLabel: string;
  dataStatus: "demo";
  timeline: { date: number; label: string }[];
  preparationChecklist: string[];
  notes: string;
};

const d = (y: number, m: number, day: number) => Date.UTC(y, m - 1, day, 18, 30);

export const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    slug: "northstar-campus-hack-sprint",
    name: "Northstar Campus Hack Sprint",
    organiser: "Northstar Demo Collective",
    description:
      "A 36-hour campus sprint for student teams building small, useful AI tools. The demo record includes a mentor review round and a written build log requirement.",
    domain: "AI & Developer Tools",
    format: "online",
    location: "Remote",
    registrationDeadline: d(2026, 12, 4),
    startDate: d(2026, 12, 12),
    endDate: d(2026, 12, 13),
    skillsRequired: ["React", "TypeScript", "Python", "Machine Learning"],
    eligibility: "Students in any year, teams of 2–4",
    prizeRange: "Demo prize pool: ₹50,000",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2026, 11, 24), label: "Registration opens" },
      { date: d(2026, 12, 4), label: "Registration closes" },
      { date: d(2026, 12, 12), label: "Sprint begins" },
      { date: d(2026, 12, 13), label: "Demos and mentor review" },
    ],
    preparationChecklist: [
      "Confirm eligibility and team size on the official listing",
      "Prepare a 60-second problem statement",
      "Brush up on React state management",
      "Finish one scikit-learn tutorial end to end",
      "Draft a repository README structure",
    ],
    notes:
      "Demonstration record created for BuildScope. It is not a real hackathon and has no official registration link.",
  },
  {
    slug: "open-source-harvest",
    name: "Open Source Harvest",
    organiser: "Harvest Demo Foundation",
    description:
      "A contribution-first challenge: pick an open issue from a partner project, ship a reviewed pull request and present what you learned. Judged on clarity of contribution, not project size.",
    domain: "Open Source",
    format: "hybrid",
    location: "Remote + Pune hub",
    registrationDeadline: d(2026, 12, 18),
    startDate: d(2027, 1, 9),
    endDate: d(2027, 1, 10),
    skillsRequired: ["Git & GitHub", "JavaScript", "Technical Writing"],
    eligibility: "2nd year and above, solo or teams of 2",
    minYear: "2nd year",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2026, 12, 1), label: "Partner repositories announced" },
      { date: d(2026, 12, 18), label: "Registration closes" },
      { date: d(2027, 1, 9), label: "Contribution window opens" },
      { date: d(2027, 1, 10), label: "Review and showcase" },
    ],
    preparationChecklist: [
      "Read the contributing guide of one target repository",
      "Make one small documentation pull request",
      "Learn how to write a clear commit message",
    ],
    notes:
      "Demonstration record. Partner projects and dates are illustrative only.",
  },
  {
    slug: "civic-data-relay",
    name: "Civic Data Relay",
    organiser: "Civic Relay Demo Lab",
    description:
      "A data storytelling challenge using open civic datasets. Teams produce an analysis notebook, one visual narrative and a short limitations section.",
    domain: "Civic Tech & Data",
    format: "online",
    location: "Remote",
    registrationDeadline: d(2027, 1, 8),
    startDate: d(2027, 1, 16),
    endDate: d(2027, 1, 17),
    skillsRequired: ["Python", "SQL", "Data Visualisation"],
    eligibility: "All students, teams of up to 4",
    prizeRange: "Demo prize pool: ₹30,000",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2027, 1, 8), label: "Registration closes" },
      { date: d(2027, 1, 12), label: "Datasets released" },
      { date: d(2027, 1, 16), label: "Analysis window opens" },
      { date: d(2027, 1, 17), label: "Storytelling showcase" },
    ],
    preparationChecklist: [
      "Practise one SQL aggregation query set",
      "Build a single chart with a clear takeaway",
      "Write a short data limitations note",
    ],
    notes:
      "Demonstration record. No live dataset or official registration page exists.",
  },
  {
    slug: "green-grid-challenge",
    name: "Green Grid Challenge",
    organiser: "Green Grid Demo Studio",
    description:
      "A sustainability-themed product build focused on everyday energy decisions. Teams ship a working front end and a short evidence log.",
    domain: "Sustainability",
    format: "offline",
    location: "Bengaluru (venue in demo record)",
    registrationDeadline: d(2027, 1, 22),
    startDate: d(2027, 2, 5),
    endDate: d(2027, 2, 7),
    skillsRequired: ["React", "TypeScript", "Node.js", "Design Systems"],
    eligibility: "All students, teams of 3–4",
    prizeRange: "Demo prize pool: ₹75,000",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2027, 1, 22), label: "Registration closes" },
      { date: d(2027, 2, 5), label: "On-site build begins" },
      { date: d(2027, 2, 7), label: "Judging and showcase" },
    ],
    preparationChecklist: [
      "Sketch the core user journey",
      "Decide on one accessibility baseline",
      "Set up a TypeScript + React starter",
      "Prepare an evidence folder for the build log",
    ],
    notes:
      "Demonstration record. Venue, prizes and organisers are fictional.",
  },
  {
    slug: "design-systems-sprint",
    name: "Design Systems Sprint",
    organiser: "Kerning Demo Group",
    description:
      "A focused design-engineering sprint: build a small, accessible component library with documented tokens and a rationale for every decision.",
    domain: "Product Design",
    format: "online",
    location: "Remote",
    registrationDeadline: d(2026, 12, 11),
    startDate: d(2026, 12, 19),
    endDate: d(2026, 12, 20),
    skillsRequired: ["Figma", "Design Systems", "React"],
    eligibility: "All students, solo or teams of 2",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2026, 12, 11), label: "Registration closes" },
      { date: d(2026, 12, 19), label: "Sprint begins" },
      { date: d(2026, 12, 20), label: "Component review" },
    ],
    preparationChecklist: [
      "Collect three reference design systems",
      "Define colour and spacing tokens",
      "Audit one component for keyboard access",
    ],
    notes: "Demonstration record. No official listing or organiser exists.",
  },
  {
    slug: "fintech-sandbox-build",
    name: "Fintech Sandbox Build",
    organiser: "Sandbox Demo Network",
    description:
      "A payments-and-budgeting prototype challenge with a strong emphasis on API design, auditability and security basics.",
    domain: "Fintech",
    format: "hybrid",
    location: "Remote + Mumbai hub",
    registrationDeadline: d(2027, 2, 5),
    startDate: d(2027, 2, 19),
    endDate: d(2027, 2, 21),
    skillsRequired: ["Python", "SQL", "REST APIs", "Security Fundamentals"],
    eligibility: "3rd year and above, teams of 2–4",
    minYear: "3rd year",
    prizeRange: "Demo prize pool: ₹1,00,000",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2027, 1, 15), label: "Problem statements released" },
      { date: d(2027, 2, 5), label: "Registration closes" },
      { date: d(2027, 2, 19), label: "Build begins" },
      { date: d(2027, 2, 21), label: "Final demos" },
    ],
    preparationChecklist: [
      "Write one API contract with example requests",
      "Review the OWASP Top Ten",
      "Practise a simple audit-trail design",
    ],
    notes:
      "Demonstration record. No real financial product, prize or registration exists.",
  },
  {
    slug: "public-health-data-jam",
    name: "Public Health Data Jam",
    organiser: "Wellspring Demo Co-op",
    description:
      "A short data jam exploring public-health trends. Teams submit a notebook, a cautious interpretation and a plain-language summary.",
    domain: "Health & ML",
    format: "online",
    location: "Remote",
    registrationDeadline: d(2026, 11, 30),
    startDate: d(2026, 12, 5),
    endDate: d(2026, 12, 6),
    skillsRequired: ["Python", "Machine Learning", "Data Visualisation"],
    eligibility: "All students, teams of up to 3",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2026, 11, 30), label: "Registration closes" },
      { date: d(2026, 12, 5), label: "Jam begins" },
      { date: d(2026, 12, 6), label: "Submission and peer review" },
    ],
    preparationChecklist: [
      "Revise train/test splitting",
      "Practise writing a limitations paragraph",
      "Prepare one reusable notebook template",
    ],
    notes:
      "Demonstration record. Health data, organisers and dates are illustrative.",
  },
  {
    slug: "campus-product-studio-sprint",
    name: "Campus Product Studio Sprint",
    organiser: "Studio Nine Demo Collective",
    description:
      "A product-engineering sprint where the deliverable is a working, tested slice of a real workflow — plus a written decision log.",
    domain: "Product Engineering",
    format: "offline",
    location: "Hyderabad (venue in demo record)",
    registrationDeadline: d(2027, 3, 5),
    startDate: d(2027, 3, 19),
    endDate: d(2027, 3, 21),
    skillsRequired: ["React", "TypeScript", "Testing", "Product Thinking"],
    eligibility: "2nd year and above, teams of 3–4",
    minYear: "2nd year",
    prizeRange: "Demo prize pool: ₹60,000",
    sourceLabel: "Demonstration record — no official source",
    dataStatus: "demo",
    timeline: [
      { date: d(2027, 2, 12), label: "Applications open" },
      { date: d(2027, 3, 5), label: "Registration closes" },
      { date: d(2027, 3, 19), label: "Build begins" },
      { date: d(2027, 3, 21), label: "Demo day" },
    ],
    preparationChecklist: [
      "Write one user story with acceptance criteria",
      "Add a first automated test to a side project",
      "Prepare a short decision log template",
    ],
    notes:
      "Demonstration record. Venue, prizes and organisers are fictional.",
  },
];
