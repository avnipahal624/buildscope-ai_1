import { api, type Evidence, type Project, type ProjectComparison, type ProjectReport, type SimilarProject, type StakeholderNeed } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { useSearchParams } from "react-router";

export function useProjectData() {
  const [params] = useSearchParams();
  const projectId = params.get("project") || undefined;
  const resource = useResource(async (signal) => {
    const projects = await api.listProjects(signal);
    const project = projects.find((item) => item.id === projectId) || projects[0];
    if (!project) return { projects, project: null, report: null, evidence: [], needs: [], similar: [], comparisons: [] as ProjectComparison[] };
    const [report, evidence, needs, similar, comparisons] = await Promise.all([
      api.getReport(project.id, signal), api.listEvidence(project.id, undefined, signal),
      api.listNeeds(project.id, undefined, signal), api.listSimilarProjects(project.id, signal), api.listComparisons(project.id, signal),
    ]);
    return { projects, project, report, evidence, needs, similar, comparisons };
  }, [projectId]);
  return { ...resource, projectId, data: resource.data as ({ projects: Project[]; project: Project | null; report: ProjectReport | null; evidence: Evidence[]; needs: StakeholderNeed[]; similar: SimilarProject[]; comparisons: ProjectComparison[] } | undefined) };
}
