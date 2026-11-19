export type SkillDefinition = {
  name: string;
  category: string;
  hours: number;
  resourceLabel?: string;
  resourceUrl?: string;
};

export const SKILL_LIBRARY: SkillDefinition[] = [
  {
    name: "React",
    category: "Frontend",
    hours: 12,
    resourceLabel: "React — Learn (official docs)",
    resourceUrl: "https://react.dev/learn",
  },
  {
    name: "TypeScript",
    category: "Frontend",
    hours: 10,
    resourceLabel: "TypeScript Handbook",
    resourceUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
  },
  {
    name: "JavaScript",
    category: "Frontend",
    hours: 10,
    resourceLabel: "MDN JavaScript Guide",
    resourceUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  },
  {
    name: "Tailwind CSS",
    category: "Frontend",
    hours: 4,
    resourceLabel: "Tailwind CSS documentation",
    resourceUrl: "https://tailwindcss.com/docs",
  },
  {
    name: "Design Systems",
    category: "Design",
    hours: 8,
    resourceLabel: "Design Tokens format specification",
    resourceUrl: "https://tr.designtokens.org/format/",
  },
  {
    name: "Figma",
    category: "Design",
    hours: 5,
    resourceLabel: "Figma resource library",
    resourceUrl: "https://www.figma.com/resource-library/",
  },
  {
    name: "Product Thinking",
    category: "Product",
    hours: 6,
    resourceLabel: "Product Talk — discovery resources",
    resourceUrl: "https://www.producttalk.org/",
  },
  {
    name: "Python",
    category: "Backend & Data",
    hours: 12,
    resourceLabel: "The Python Tutorial",
    resourceUrl: "https://docs.python.org/3/tutorial/",
  },
  {
    name: "Node.js",
    category: "Backend & Data",
    hours: 8,
    resourceLabel: "Node.js — Learn",
    resourceUrl: "https://nodejs.org/en/learn",
  },
  {
    name: "REST APIs",
    category: "Backend & Data",
    hours: 6,
    resourceLabel: "MDN — Overview of HTTP",
    resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
  },
  {
    name: "SQL",
    category: "Backend & Data",
    hours: 8,
    resourceLabel: "PostgreSQL tutorial",
    resourceUrl: "https://www.postgresql.org/docs/current/tutorial.html",
  },
  {
    name: "Git & GitHub",
    category: "Tooling",
    hours: 4,
    resourceLabel: "GitHub — Get started",
    resourceUrl: "https://docs.github.com/en/get-started",
  },
  {
    name: "Testing",
    category: "Engineering",
    hours: 6,
    resourceLabel: "Vitest guide",
    resourceUrl: "https://vitest.dev/guide/",
  },
  {
    name: "System Design",
    category: "Engineering",
    hours: 14,
    resourceLabel: "The System Design Primer",
    resourceUrl: "https://github.com/donnemartin/system-design-primer",
  },
  {
    name: "Docker",
    category: "Engineering",
    hours: 6,
    resourceLabel: "Docker — Get started",
    resourceUrl: "https://docs.docker.com/get-started/",
  },
  {
    name: "Security Fundamentals",
    category: "Engineering",
    hours: 7,
    resourceLabel: "OWASP Top Ten",
    resourceUrl: "https://owasp.org/www-project-top-ten/",
  },
  {
    name: "Machine Learning",
    category: "Data & AI",
    hours: 16,
    resourceLabel: "scikit-learn — Getting started",
    resourceUrl: "https://scikit-learn.org/stable/getting_started.html",
  },
  {
    name: "Data Visualisation",
    category: "Data & AI",
    hours: 6,
    resourceLabel: "Observable Plot documentation",
    resourceUrl: "https://observablehq.com/plot/",
  },
  {
    name: "Data Analysis",
    category: "Data & AI",
    hours: 10,
    resourceLabel: "pandas — Getting started",
    resourceUrl: "https://pandas.pydata.org/docs/getting_started/index.html",
  },
  {
    name: "Technical Writing",
    category: "Communication",
    hours: 4,
    resourceLabel: "Google Technical Writing courses",
    resourceUrl: "https://developers.google.com/tech-writing",
  },
  {
    name: "Algorithms",
    category: "Computer Science",
    hours: 14,
    resourceLabel: "Algorithms, 4th Edition",
    resourceUrl: "https://algs4.cs.princeton.edu/home/",
  },
  {
    name: "Cloud Basics",
    category: "Engineering",
    hours: 7,
    resourceLabel: "Google Cloud — Get started",
    resourceUrl: "https://cloud.google.com/docs/get-started",
  },
];

export const SKILL_NAMES = SKILL_LIBRARY.map((skill) => skill.name);

const ALIASES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  reactjs: "React",
  react: "React",
  "react.js": "React",
  py: "Python",
  python: "Python",
  ml: "Machine Learning",
  "machine learning": "Machine Learning",
  ai: "Machine Learning",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  github: "Git & GitHub",
  git: "Git & GitHub",
  "git & github": "Git & GitHub",
  sql: "SQL",
  postgres: "SQL",
  figma: "Figma",
  "design system": "Design Systems",
  "design systems": "Design Systems",
  testing: "Testing",
  tests: "Testing",
  "technical writing": "Technical Writing",
  documentation: "Technical Writing",
  "data visualization": "Data Visualisation",
  "data visualisation": "Data Visualisation",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  api: "REST APIs",
  "apis": "REST APIs",
  html: "JavaScript",
  css: "Tailwind CSS",
  tailwind: "Tailwind CSS",
  algorithms: "Algorithms",
  dsa: "Algorithms",
  docker: "Docker",
  security: "Security Fundamentals",
  "security basics": "Security Fundamentals",
  "security fundamentals": "Security Fundamentals",
  "system design": "System Design",
  "product thinking": "Product Thinking",
  "cloud basics": "Cloud Basics",
  "data analysis": "Data Analysis",
};

export function canonicalSkill(skill: string): string {
  const key = skill.trim().toLowerCase();
  return ALIASES[key] ?? skill.trim();
}

export function skillKey(skill: string): string {
  return canonicalSkill(skill).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function skillDefinition(skill: string): SkillDefinition | undefined {
  const canonical = canonicalSkill(skill);
  return SKILL_LIBRARY.find(
    (entry) => entry.name.toLowerCase() === canonical.toLowerCase(),
  );
}

export function normaliseSkills(skills: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const skill of skills ?? []) {
    const key = skillKey(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(canonicalSkill(skill));
  }
  return out;
}

export function hasSkill(userSkills: string[] | undefined, skill: string) {
  const key = skillKey(skill);
  return (userSkills ?? []).some((entry) => skillKey(entry) === key);
}

export const DOMAINS = [
  "AI & Developer Tools",
  "Open Source",
  "Civic Tech & Data",
  "Sustainability",
  "Product Design",
  "Fintech",
  "Health & ML",
  "Product Engineering",
];

export const INTERESTS = [
  "AI & Machine Learning",
  "Web Development",
  "Open Source",
  "Data & Analytics",
  "Product Design",
  "Startups",
  "Sustainability",
  "Fintech",
  "Health Tech",
  "Developer Tools",
];

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export const ACADEMIC_YEARS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "Postgraduate",
];

export const STUDENT_GOALS = [
  "Participate in hackathons",
  "Build better projects",
  "Learn new technologies",
  "Find internships",
  "Contribute to open source",
];
