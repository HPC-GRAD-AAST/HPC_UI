import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  analyticsApi,
  clustersApi,
  jobsApi,
  jobGroupsApi,
  simulationsApi,
  tracesApi,
  experimentsApi,
  workflowsApi,
  ClusterCreate,
  JobCreate,
  JobPatch,
  SimulationCreate,
  ExperimentConfigCreate,
  WorkflowDefinitionCreate,
  WorkflowDefinitionUpdate,
} from "./api";

export function useClusters() {
  return useQuery({ queryKey: ["clusters"], queryFn: clustersApi.list });
}

export function useCluster(id: string | null) {
  return useQuery({
    queryKey: ["clusters", id],
    queryFn: () => clustersApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ClusterCreate) => clustersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clusters"] }),
  });
}

export function useDeleteCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clustersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clusters"] }),
  });
}

export function useJobs(params?: {
  name_contains?: string;
  priority?: string;
  group_id?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery({ queryKey: ["jobs", params], queryFn: () => jobsApi.list(params) });
}

export function useJobGroups() {
  return useQuery({ queryKey: ["job-groups"], queryFn: jobGroupsApi.list });
}

export function useCreateJobGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string | null }) => jobGroupsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-groups"] }),
  });
}

export function usePatchJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: JobPatch }) => jobsApi.patch(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JobCreate) => jobsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useBulkCreateJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobs: JobCreate[]) => jobsApi.bulkCreate(jobs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useSimulations(
  clusterId?: string,
  extra?: { status?: string; policy?: string; skip?: number; limit?: number; sort_desc?: boolean },
) {
  return useQuery({
    queryKey: ["simulations", clusterId, extra],
    queryFn: () =>
      simulationsApi.list({
        cluster_id: clusterId,
        limit: extra?.limit ?? 2000,
        skip: extra?.skip ?? 0,
        status: extra?.status,
        policy: extra?.policy,
        sort_desc: extra?.sort_desc ?? true,
      }),
  });
}

export function useAnalyticsOverview() {
  return useQuery({ queryKey: ["analytics", "overview"], queryFn: analyticsApi.overview });
}

export function useSimulationSummaries(ids: string[]) {
  const sorted = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["simulation-summaries", sorted],
    queryFn: () => simulationsApi.summaries(ids),
    enabled: ids.length > 0,
  });
}

export function useBenchmarkRun() {
  return useMutation({
    mutationFn: analyticsApi.benchmark,
  });
}

export function useMaterializeWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.fromWorkflow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job-groups"] });
    },
  });
}

export function useWorkflowDefinitions() {
  return useQuery({ queryKey: ["workflows"], queryFn: workflowsApi.list });
}

export function useWorkflowDefinition(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["workflows", id],
    queryFn: () => workflowsApi.get(id!),
    enabled: !!id && enabled,
  });
}

export function useCreateWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WorkflowDefinitionCreate) => workflowsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useUpdateWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: WorkflowDefinitionUpdate }) =>
      workflowsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflows", id] });
    },
  });
}

export function useDeleteWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useMaterializeWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.materialize(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job-groups"] });
    },
  });
}

export function useExperimentRunsAll(params?: {
  configId?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["experiment-runs-all", params],
    queryFn: () => analyticsApi.experimentRuns(params),
  });
}

export function useSimulation(id: string | null) {
  return useQuery({
    queryKey: ["simulations", id],
    queryFn: () => simulationsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 2000 : false;
    },
  });
}

export function useSimulationSnapshots(id: string | null) {
  return useQuery({
    queryKey: ["simulations", id, "snapshots"],
    queryFn: () => simulationsApi.snapshots(id!),
    enabled: !!id,
  });
}

export function useCreateSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SimulationCreate) => simulationsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulations"] }),
  });
}

export function useDeleteSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => simulationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulations"] }),
  });
}

export function useTraces() {
  return useQuery({ queryKey: ["traces"], queryFn: tracesApi.list });
}

export function useTraceStatus(id: string | null) {
  return useQuery({
    queryKey: ["traces", id, "status"],
    queryFn: () => tracesApi.status(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "processing" ? 2000 : false;
    },
  });
}

export function useUploadTrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name, maxJobs }: { file: File; name: string; maxJobs?: number }) =>
      tracesApi.upload(file, name, maxJobs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["traces"] }),
  });
}

export function useDeleteTrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tracesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traces"] });
    },
  });
}

export function useExperimentConfigs() {
  return useQuery({ queryKey: ["experiments"], queryFn: experimentsApi.listConfigs });
}

export function useExperimentConfig(id: string | null) {
  return useQuery({
    queryKey: ["experiments", id],
    queryFn: () => experimentsApi.getConfig(id!),
    enabled: !!id,
  });
}

export function useCreateExperimentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExperimentConfigCreate) => experimentsApi.createConfig(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["experiments"] }),
  });
}

export function useDeleteExperimentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => experimentsApi.deleteConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["experiments"] }),
  });
}

export function useTriggerExperimentRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config_id: string) => experimentsApi.triggerRun(config_id),
    onSuccess: (_data, config_id) => {
      qc.invalidateQueries({ queryKey: ["experiment-runs", config_id] });
    },
  });
}

export function useExperimentRuns(config_id: string | null) {
  return useQuery({
    queryKey: ["experiment-runs", config_id],
    queryFn: () => experimentsApi.listRuns(config_id!),
    enabled: !!config_id,
    refetchInterval: 5000,
  });
}

export function useExperimentRun(run_id: string | null) {
  return useQuery({
    queryKey: ["experiment-run", run_id],
    queryFn: () => experimentsApi.getRun(run_id!),
    enabled: !!run_id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 2000 : false;
    },
  });
}
