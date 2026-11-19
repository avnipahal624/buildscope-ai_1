import { hasSkill, normaliseSkills } from "./skills";

/**
 * DOCUMENTED MATCH FORMULA (visible in the UI on every detail page):
 *
 *   Skill coverage   60 pts  shared required skills ÷ required skills
 *   Domain fit       20 pts  preferred domain (20) / related interest (10)
 *   Eligibility      15 pts  academic year minimum satisfied
 *   Preparation time  5 pts  weeks until registration closes × weekly hours
 *                            versus a 5-hour estimate per missing skill
 *
 * No other factors are used, and every score ships with its reasons.
 */
export const MATCH_WEIGHTS = {
  skills: 60,
  domain: 20,
  eligibility: 15,
  time: 5,
};

export type MatchProfile = {
  skills?: string[];
  domains?: string[];
  interests?: string[];
  academicYear?: string;
  weeklyHours?: number;
};

export type MatchOpportunity = {
  slug: string;
  name: string;
  domain: string;
  skillsRequired: string[];
  registrationDeadline: number;
  minYear?: string;
};

export type MatchResult = {
  score: number;
  covered: string[];
  gaps: string[];
  eligible: boolean;
  reasons: string[];
  breakdown: { label: string; points: number; max: number; detail: string }[];
  daysLeft: number;
};

const YEAR_RANK: Record<string, number> = {
  "1st year": 1,
  "2nd year": 2,
  "3rd year": 3,
  "4th year": 4,
  Postgraduate: 5,
};

export function daysUntil(timestamp: number) {
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

export function matchOpportunity(
  opportunity: MatchOpportunity,
  profile: MatchProfile,
): MatchResult {
  const required = normaliseSkills(opportunity.skillsRequired);
  const covered = required.filter((skill) => hasSkill(profile.skills, skill));
  const gaps = required.filter((skill) => !hasSkill(profile.skills, skill));
  const skillRatio = required.length === 0 ? 1 : covered.length / required.length;
  const skillPoints = Math.round(skillRatio * MATCH_WEIGHTS.skills);

  const domains = (profile.domains ?? []).map((d) => d.toLowerCase());
  const interests = (profile.interests ?? []).map((i) => i.toLowerCase());
  const domainLower = opportunity.domain.toLowerCase();
  const exactDomain = domains.includes(domainLower);
  const relatedInterest = interests.some(
    (interest) =>
      domainLower.includes(interest.split(" ")[0]) ||
      interest.includes(domainLower.split(" ")[0]),
  );
  const domainPoints = exactDomain
    ? MATCH_WEIGHTS.domain
    : relatedInterest
      ? Math.round(MATCH_WEIGHTS.domain / 2)
      : 0;

  const studentRank = YEAR_RANK[profile.academicYear ?? ""] ?? 1;
  const minimumRank = opportunity.minYear
    ? (YEAR_RANK[opportunity.minYear] ?? 1)
    : 1;
  const eligible = studentRank >= minimumRank;
  const eligibilityPoints = eligible ? MATCH_WEIGHTS.eligibility : 0;

  const daysLeft = daysUntil(opportunity.registrationDeadline);
  const weeklyHours = profile.weeklyHours ?? 5;
  const availableHours = Math.max(0, (daysLeft / 7) * weeklyHours);
  const estimatedNeed = Math.max(1, gaps.length) * 5;
  const timeRatio = gaps.length === 0 ? 1 : Math.min(1, availableHours / estimatedNeed);
  const timePoints = daysLeft <= 0 ? 0 : Math.max(1, Math.round(timeRatio * MATCH_WEIGHTS.time));

  const score = Math.min(
    100,
    skillPoints + domainPoints + eligibilityPoints + timePoints,
  );

  const reasons: string[] = [];
  if (covered.length > 0) {
    reasons.push(
      `You already list ${covered.slice(0, 3).join(", ")}${
        covered.length > 3 ? ` and ${covered.length - 3} more` : ""
      }.`,
    );
  }
  if (gaps.length > 0) {
    reasons.push(
      `${gaps.slice(0, 3).join(", ")} ${gaps.length === 1 ? "is" : "are"} still a gap — the roadmap can cover ${gaps.length === 1 ? "it" : "them"}.`,
    );
  } else {
    reasons.push("Your profile covers every listed skill.");
  }
  if (exactDomain) reasons.push(`${opportunity.domain} is one of your preferred domains.`);
  else if (relatedInterest) reasons.push(`${opportunity.domain} overlaps with your interests.`);
  else reasons.push("This domain is outside your stated preferences, so domain fit is low.");
  reasons.push(
    eligible
      ? `Eligibility matches your academic year${opportunity.minYear ? ` (minimum ${opportunity.minYear})` : ""}.`
      : `Eligibility needs review: this record asks for ${opportunity.minYear}.`,
  );
  reasons.push(
    daysLeft <= 0
      ? "Registration has closed in this record."
      : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to register — about ${Math.round(availableHours)}h of prep at ${weeklyHours}h/week.`,
  );

  return {
    score,
    covered,
    gaps,
    eligible,
    reasons,
    daysLeft,
    breakdown: [
      {
        label: "Skill coverage",
        points: skillPoints,
        max: MATCH_WEIGHTS.skills,
        detail: `${covered.length}/${required.length} required skills on your profile`,
      },
      {
        label: "Domain fit",
        points: domainPoints,
        max: MATCH_WEIGHTS.domain,
        detail: exactDomain
          ? "Preferred domain"
          : relatedInterest
            ? "Related interest"
            : "No domain overlap",
      },
      {
        label: "Eligibility",
        points: eligibilityPoints,
        max: MATCH_WEIGHTS.eligibility,
        detail: eligible ? "Eligibility met" : "Check the eligibility requirement",
      },
      {
        label: "Preparation time",
        points: timePoints,
        max: MATCH_WEIGHTS.time,
        detail: `${Math.round(availableHours)}h available for ~${estimatedNeed}h of prep`,
      },
    ],
  };
}
