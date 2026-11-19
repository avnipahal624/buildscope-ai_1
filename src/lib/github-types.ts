export type RelatedRepo = {
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  updatedAt: string | null;
  license: string | null;
  conceptSimilarity: number;
  sharedBlobFiles: number;
  candidateTreeRead: boolean;
  sharedFilePaths: string[];
  licenceComparison: "same" | "different" | "unknown";
  candidateIsFork: boolean;
};

export type RepoReport = {
  dataStatus: "verified";
  repoUrl: string;
  owner: string;
  name: string;
  description: string | null;
  homepage: string | null;
  visibility: string;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  languages: { language: string; bytes: number }[];
  license: string | null;
  licenseName: string | null;
  defaultBranch: string;
  branches: string[];
  branchCount: number;
  commitSampleSize: number;
  commitsPerWeek: number;
  lastCommitAt: string | null;
  recentCommits: { sha: string; message: string; date: string; author: string | null }[];
  readmePresent: boolean;
  readmePath: string | null;
  releases: number;
  latestRelease: string | null;
  topics: string[];
  hasWorkflows: boolean;
  workflowFiles: string[];
  dependencies: { name: string; version: string; ecosystem: string }[];
  structure: { path: string; type: string; size?: number }[];
  fileFingerprints: { path: string; sha: string }[];
  fileCount: number;
  treeAvailable: boolean;
  isFork: boolean;
  parent: string | null;
  source: string | null;
  ancestors: string[];
  related: RelatedRepo[];
  limitations: string[];
  checkedAt: number;
};

export type RepoAnalysisResult =
  | {
      status: "verified";
      repoUrl: string;
      owner: string;
      repoName: string;
      report: RepoReport;
      error: null;
    }
  | {
      status: "unavailable";
      repoUrl: string;
      owner: string;
      repoName: string;
      error: string;
    };

export function readRepoReport(value: unknown): RepoReport | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RepoReport>;
  if (candidate.dataStatus !== "verified") return null;
  return {
    ...(candidate as RepoReport),
    languages: candidate.languages ?? [],
    branches: candidate.branches ?? [],
    recentCommits: candidate.recentCommits ?? [],
    topics: candidate.topics ?? [],
    workflowFiles: candidate.workflowFiles ?? [],
    dependencies: candidate.dependencies ?? [],
    structure: candidate.structure ?? [],
    fileFingerprints: candidate.fileFingerprints ?? [],
    ancestors: candidate.ancestors ?? [],
    related: (candidate.related ?? []).map((item) => ({
      ...item,
      sharedFilePaths: item.sharedFilePaths ?? [],
      candidateTreeRead: item.candidateTreeRead ?? false,
    })),
    limitations: candidate.limitations ?? [],
    treeAvailable: candidate.treeAvailable ?? false,
  };
}
