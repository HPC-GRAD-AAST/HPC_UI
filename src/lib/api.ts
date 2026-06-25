import axios from "axios";
import { clearStoredToken, getStoredToken } from "./auth";

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") + "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  // Default instance sets Content-Type: application/json; that breaks multipart uploads.
  // Let the runtime set multipart/form-data with boundary for FormData bodies.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const url = String(err.config?.url ?? "");
    if (status === 401 && !url.includes("auth/login")) {
      clearStoredToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export type SchedulerPolicy =
  | "fcfs"
  | "sjf"
  | "priority"
  | "roundrobin"
  | "bestfit"
  | "worstfit"
  | "loadbalancing"
  | "easybackfill"
  | "rl"
  | "rl_v2"
  | "rl_backfill";

export type SimulationStatus = "pending" | "running" | "done" | "failed";
export type TraceStatus = "processing" | "ready" | "failed";

export interface NodeCreate {
  total_cpus: number;
  total_mem: number;
  idle_watts: number;
  max_watts: number;
  zone?: string;
  node_type?: string;
  labels?: Record<string, string>;
}

export interface ClusterCreate {
  name: string;
  bandwidth?: number;
  nodes: NodeCreate[];
}

/** Persisted node — API may return snake_case or camelCase (Pydantic aliases). */
export interface NodeResponse {
  id: string;
  total_cpus?: number;
  totalCpus?: number;
  total_mem?: number;
  totalMem?: number;
  idle_watts?: number;
  idleWatts?: number;
  max_watts?: number;
  maxWatts?: number;
  zone?: string;
  node_type?: string;
  nodeType?: string;
  labels?: Record<string, string>;
  cluster_id?: string;
  clusterId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function nodeTotalCpus(n: Pick<NodeResponse, "total_cpus" | "totalCpus">): number {
  const v = n.total_cpus ?? n.totalCpus;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function nodeTotalMem(n: Pick<NodeResponse, "total_mem" | "totalMem">): number {
  const v = n.total_mem ?? n.totalMem;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function nodeIdleWatts(n: Pick<NodeResponse, "idle_watts" | "idleWatts">): number {
  const v = n.idle_watts ?? n.idleWatts;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function nodeMaxWatts(n: Pick<NodeResponse, "max_watts" | "maxWatts">): number {
  const v = n.max_watts ?? n.maxWatts;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function nodeZone(n: Pick<NodeResponse, "zone">): string {
  return n.zone ?? "—";
}

export function nodeTypeLabel(n: Pick<NodeResponse, "node_type" | "nodeType">): string {
  return n.node_type ?? n.nodeType ?? "—";
}

export interface ClusterResponse {
  id: string;
  name: string;
  bandwidth: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  nodes: NodeResponse[];
}

export interface ClusterSummary {
  id: string;
  name: string;
  bandwidth: number;
  node_count?: number;
  nodeCount?: number;
  created_at?: string;
  createdAt?: string;
}

export function clusterNodeCount(c: Pick<ClusterSummary, "node_count" | "nodeCount">): number {
  const v = c.node_count ?? c.nodeCount;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function clusterCreatedAtIso(c: { created_at?: string; createdAt?: string }): string {
  return c.created_at ?? c.createdAt ?? "";
}

export function clusterUpdatedAtIso(c: { updated_at?: string; updatedAt?: string }): string {
  return c.updated_at ?? c.updatedAt ?? "";
}

/** Short label for UUIDs in UI (full id available via copy). */
export function shortenUuid(id: string, visible = 8): string {
  if (!id) return "—";
  return id.length <= visible + 1 ? id : `${id.slice(0, visible)}…`;
}

export interface JobCreate {
  name: string;
  duration: number;
  submission_time: number;
  cpu_req: number;
  mem_req: number;
  data_size_gb: number;
  priority?: "LOW" | "NORMAL" | "HIGH";
  queue_name?: string;
  max_retries?: number;
  node_constraints?: Record<string, string>;
  dependencies?: string[];
  group_id?: string | null;
}

export interface JobResponse extends JobCreate {
  id: string;
  group_id?: string | null;
  group_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobSummary {
  id: string;
  name: string;
  cpu_req: number;
  mem_req: number;
  duration: number;
  priority: string;
  dependencies?: string[];
  group_id?: string | null;
  group_name?: string | null;
  created_at: string;
}

export interface JobPatch {
  group_id?: string | null;
}

export interface JobGroup {
  id: string;
  name: string;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedJobs {
  items: JobSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AnalyticsOverview {
  simulationsTotal: number;
  simulationsByStatus: Record<string, number>;
  simulationsByPolicy: Record<string, number>;
  jobsTotal: number;
  clustersTotal: number;
  experimentConfigs: number;
  workloadTracesReady: number;
}

export interface BenchmarkRunRequest {
  cluster_id: string;
  workload_trace_id: string;
  policies: string[];
  n_iters?: number;
  seq_len?: number;
  metrics_interval?: number;
}

export interface BenchmarkRunMetrics {
  boundedSlowdown: number;
  avgWaitTime: number;
  avgResponseTime: number;
  utilization: number;
  jobsCompleted: number;
  jobsTotal: number;
  makespan: number;
  iteration: number;
}

export interface BenchmarkPolicyResult {
  policy: string;
  traceName: string;
  runs: BenchmarkRunMetrics[];
}

export interface BenchmarkRunResponse {
  policies: BenchmarkPolicyResult[];
  clusterId: string;
  workloadTraceId: string;
  warnings: string[];
}

export interface WorkflowNodePayload {
  clientId: string;
  name?: string;
  duration?: number;
  cpuReq?: number;
  memReq?: number;
  dataSizeGb?: number;
  priority?: "LOW" | "NORMAL" | "HIGH";
  queueName?: string;
  maxRetries?: number;
  submissionTime?: number;
}

export interface WorkflowEdgePayload {
  source: string;
  target: string;
}

export interface WorkflowMaterializeRequest {
  nodes: WorkflowNodePayload[];
  edges: WorkflowEdgePayload[];
  /** If set, all new jobs are placed in a new group (optional for /jobs/from-workflow). */
  jobGroupName?: string;
}

export interface WorkflowMaterializeResponse {
  jobIds: string[];
  jobs: JobResponse[];
  jobGroupId?: string | null;
  jobGroupName?: string | null;
}

/** Saved workflow graph (API may use snake_case or camelCase; normalise in UI when reading). */
export interface WorkflowGraphStoredNode {
  id: string;
  label?: string;
  duration?: number;
  cpu_req?: number;
  cpuReq?: number;
  mem_req?: number;
  memReq?: number;
  data_size_gb?: number;
  dataSizeGb?: number;
  priority?: string;
  queue_name?: string;
  queueName?: string;
  max_retries?: number;
  maxRetries?: number;
  submission_time?: number;
  submissionTime?: number;
  x?: number | null;
  y?: number | null;
}

export interface WorkflowGraphStoredEdge {
  id?: string | null;
  source: string;
  target: string;
}

export interface WorkflowGraphStored {
  nodes: WorkflowGraphStoredNode[];
  edges: WorkflowGraphStoredEdge[];
}

export interface WorkflowDefinitionSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinitionResponse {
  id: string;
  name: string;
  graph: WorkflowGraphStored;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinitionCreate {
  name: string;
  graph: WorkflowGraphStored;
}

export interface WorkflowDefinitionUpdate {
  name?: string;
  graph?: WorkflowGraphStored;
}

export const workflowsApi = {
  list: () => api.get<WorkflowDefinitionSummary[]>("/workflows/").then((r) => r.data),
  get: (id: string) => api.get<WorkflowDefinitionResponse>(`/workflows/${id}`).then((r) => r.data),
  create: (body: WorkflowDefinitionCreate) =>
    api.post<WorkflowDefinitionResponse>("/workflows/", body).then((r) => r.data),
  update: (id: string, body: WorkflowDefinitionUpdate) =>
    api.patch<WorkflowDefinitionResponse>(`/workflows/${id}`, body).then((r) => r.data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  materialize: (id: string) =>
    api.post<WorkflowMaterializeResponse>(`/workflows/${id}/materialize`).then((r) => r.data),
};

export interface TraceJobRecord {
  id: string;
  name: string;
  duration: number;
  submission_time: number;
  request_time?: number;
  cpu_req: number;
  mem_req: number;
  data_size_gb: number;
  priority: string;
  queue_name: string;
  max_retries: number;
  node_constraints: Record<string, unknown>;
  dependencies: string[];
}

export interface WorkloadTraceJobsPage {
  total: number;
  offset: number;
  limit: number;
  jobs: TraceJobRecord[];
}

export interface ExperimentRunListItem {
  id: string;
  config_id: string;
  configName: string;
  status: SimulationStatus;
  created_at: string;
}

export interface PaginatedExperimentRuns {
  items: ExperimentRunListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface SimulationCreate {
  cluster_id: string;
  job_ids: string[];
  policy: SchedulerPolicy;
  model_id?: string;   // required when policy is rl_* (a registered RL model id)
  seed?: number;
}

/** A registered hpc_rl model artifact (see rlModelsApi). */
export interface RLModel {
  id: string;
  name: string;
  path: string;
  mode: string;        // single | backfill | backfill_worker | worker | manager
  variant: string;     // mlp | kernel | attention
  workload?: string | null;
  metrics?: Record<string, unknown> | null;
  created_at?: string;
  createdAt?: string;
}

export function isRLPolicy(p: SchedulerPolicy): boolean {
  return p === "rl" || p === "rl_v2" || p === "rl_backfill";
}

export interface SimulationSummary {
  id: string;
  cluster_id: string;
  policy: SchedulerPolicy;
  status: SimulationStatus;
  created_at: string;
}

export interface PaginatedSimulations {
  items: SimulationSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface SimulationResult {
  total_time: number;
  total_energy_joules: number;
  jobs_total: number;
  jobs_completed: number;
  jobs_failed: number;
  avg_wait_time: number;
  avg_transfer_time: number;
  avg_turnaround_time: number;
}

export interface SimulationSummaryRow extends SimulationSummary {
  summary: SimulationResult | null;
}

export interface SimulationCompareResponse {
  simulations: SimulationSummaryRow[];
}

export interface SimulationResponse {
  id: string;
  cluster_id: string;
  policy: SchedulerPolicy;
  seed: number;
  status: SimulationStatus;
  summary: SimulationResult | null;
  job_results: unknown[] | null;
  node_results: unknown[] | null;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  timestamp: number;
  cluster_utilization: number;
  total_power_watts: number;
  running_jobs: number;
  waiting_jobs: number;
}

export interface SimulationSnapshotsResponse {
  id: string;
  snapshots: Snapshot[] | null;
}

/** FastAPI BaseSchema uses camelCase JSON aliases (jobCount, createdAt, …). */
export interface WorkloadTraceSummary {
  id: string;
  name: string;
  source: string;
  format: string;
  job_count?: number;
  jobCount?: number;
  status: TraceStatus;
  created_at?: string;
  createdAt?: string;
}

export interface WorkloadTraceShort {
  id: string;
  name: string;
  status: TraceStatus;
  job_count?: number;
  jobCount?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function traceJobCount(t: { job_count?: number; jobCount?: number }): number {
  const n = t.job_count ?? t.jobCount;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/** Display helper — avoids treating 0 jobs as “missing”. */
export function formatTraceJobCount(t: { job_count?: number; jobCount?: number }): string {
  const n = t.job_count ?? t.jobCount;
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

/** ISO date from API (Pydantic emits camelCase: createdAt, updatedAt). */
export function apiIsoDate(
  obj: { created_at?: string; createdAt?: string; updated_at?: string; updatedAt?: string },
  field: "created" | "updated" = "created",
): string {
  if (field === "created") return obj.created_at ?? obj.createdAt ?? "";
  return obj.updated_at ?? obj.updatedAt ?? "";
}

export function formatApiDateTime(iso: string | undefined | null): string {
  if (iso == null || iso === "") return "—";
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? "—" : t.toLocaleString();
}

export function traceCreatedAtIso(t: { created_at?: string; createdAt?: string }): string {
  return apiIsoDate(t, "created");
}

export interface ExperimentConfigCreate {
  name: string;
  cluster_id: string;
  workload_trace_id: string;
  policy: SchedulerPolicy;
  seed?: number;
  description?: string;
}

export interface ExperimentConfigSummary {
  id: string;
  name: string;
  policy: SchedulerPolicy;
  created_at?: string;
  createdAt?: string;
}

export interface ExperimentConfigResponse {
  id: string;
  name: string;
  cluster_id: string;
  workload_trace_id: string;
  policy: SchedulerPolicy;
  seed: number;
  description: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ExperimentRunSummary {
  id: string;
  config_id: string;
  configId?: string;
  status: SimulationStatus;
  created_at?: string;
  createdAt?: string;
}

export interface ExperimentRunResponse {
  id: string;
  config_id: string;
  configId?: string;
  status: SimulationStatus;
  /** Flat metrics from simulator (snake_case in DB; may appear camelCase from serializers). */
  summary: SimulationResult | Record<string, unknown> | null;
  job_results?: unknown[] | null;
  /** Alias when API serializes with camelCase (same data as `job_results`). */
  jobResults?: unknown[] | null;
  node_results?: unknown[] | null;
  /** Alias when API serializes with camelCase (same data as `node_results`). */
  nodeResults?: unknown[] | null;
  snapshots?: Snapshot[] | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

/** Normalize job list whether the API used snake_case or camelCase. */
export function experimentRunJobs(run: ExperimentRunResponse): Record<string, unknown>[] {
  const raw = run.job_results ?? run.jobResults;
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

/** Normalize node list whether the API used snake_case or camelCase. */
export function experimentRunNodes(run: ExperimentRunResponse): Record<string, unknown>[] {
  const raw = run.node_results ?? run.nodeResults;
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

export const analyticsApi = {
  overview: () => api.get<AnalyticsOverview>("/analytics/overview").then((r) => r.data),
  benchmark: (body: BenchmarkRunRequest) =>
    api.post<BenchmarkRunResponse>("/analytics/benchmark", body).then((r) => r.data),
  experimentRuns: (params?: {
    configId?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }) =>
    api
      .get<PaginatedExperimentRuns>("/analytics/experiment-runs", {
        params: {
          config_id: params?.configId,
          status: params?.status,
          skip: params?.skip,
          limit: params?.limit,
        },
      })
      .then((r) => r.data),
};

export const clustersApi = {
  list: () => api.get<ClusterSummary[]>("/clusters/").then((r) => r.data),
  get: (id: string) => api.get<ClusterResponse>(`/clusters/${id}`).then((r) => r.data),
  create: (body: ClusterCreate) => api.post<ClusterResponse>("/clusters/", body).then((r) => r.data),
  delete: (id: string) => api.delete(`/clusters/${id}`),
};

export const jobGroupsApi = {
  list: () => api.get<JobGroup[]>("/job-groups/").then((r) => r.data),
  create: (body: { name: string; color?: string | null }) =>
    api.post<JobGroup>("/job-groups/", body).then((r) => r.data),
};

export const jobsApi = {
  list: (params?: {
    name_contains?: string;
    priority?: string;
    group_id?: string;
    skip?: number;
    limit?: number;
  }) => api.get<PaginatedJobs>("/jobs/", { params }).then((r) => r.data),
  get: (id: string) => api.get<JobResponse>(`/jobs/${id}`).then((r) => r.data),
  create: (body: JobCreate) => api.post<JobResponse>("/jobs/", body).then((r) => r.data),
  patch: (id: string, body: JobPatch) => api.patch<JobResponse>(`/jobs/${id}`, body).then((r) => r.data),
  fromWorkflow: (body: WorkflowMaterializeRequest) =>
    api.post<WorkflowMaterializeResponse>("/jobs/from-workflow", body).then((r) => r.data),
  bulkCreate: (jobs: JobCreate[]) =>
    api.post<{ created: number; jobs: JobResponse[] }>("/jobs/bulk", { jobs }).then((r) => r.data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

export const simulationsApi = {
  list: (params?: {
    cluster_id?: string;
    status?: string;
    policy?: string;
    skip?: number;
    limit?: number;
    sort_desc?: boolean;
  }) => api.get<PaginatedSimulations>("/simulations/", { params }).then((r) => r.data),
  summaries: (ids: string[]) =>
    api.post<SimulationSummaryRow[]>("/simulations/summaries", { ids }).then((r) => r.data),
  compare: (ids: string[]) =>
    api
      .get<SimulationCompareResponse>(
        `/simulations/compare?${ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`,
      )
      .then((r) => r.data),
  exportSnapshotsBlob: (id: string) =>
    api.get<Blob>(`/simulations/${id}/snapshots/export`, { responseType: "blob" }).then((r) => r.data),
  get: (id: string) => api.get<SimulationResponse>(`/simulations/${id}`).then((r) => r.data),
  create: (body: SimulationCreate) => api.post<SimulationResponse>("/simulations/", body).then((r) => r.data),
  snapshots: (id: string) =>
    api.get<SimulationSnapshotsResponse>(`/simulations/${id}/snapshots`).then((r) => r.data),
  delete: (id: string) => api.delete(`/simulations/${id}`),
};

export const rlModelsApi = {
  list: () => api.get<RLModel[]>("/rl-models/").then((r) => r.data),
  get: (id: string) => api.get<RLModel>(`/rl-models/${id}`).then((r) => r.data),
  register: (body: { path: string; name?: string; metrics?: Record<string, unknown> }) =>
    api.post<RLModel>("/rl-models/", body).then((r) => r.data),
  scan: (directory: string) =>
    api.post<RLModel[]>("/rl-models/scan", { directory }).then((r) => r.data),
  delete: (id: string) => api.delete(`/rl-models/${id}`),
};

export const tracesApi = {
  list: () => api.get<WorkloadTraceSummary[]>("/workload-traces/").then((r) => r.data),
  get: (id: string) => api.get<WorkloadTraceSummary>(`/workload-traces/${id}`).then((r) => r.data),
  status: (id: string) => api.get<WorkloadTraceShort>(`/workload-traces/${id}/status`).then((r) => r.data),
  jobs: (id: string, limit = 50, offset = 0) =>
    api
      .get<WorkloadTraceJobsPage>(`/workload-traces/${id}/jobs`, { params: { limit, offset } })
      .then((r) => r.data),
  upload: (file: File, name: string, maxJobs?: number) => {
    const form = new FormData();
    // Field names must match FastAPI: file=File(...), name=Form(...), max_jobs=Form(None)
    form.append("file", file, file.name);
    form.append("name", name);
    if (maxJobs != null && maxJobs > 0) form.append("max_jobs", String(maxJobs));
    return api.post<WorkloadTraceShort>("/workload-traces/", form).then((r) => r.data);
  },
  delete: (id: string) => api.delete(`/workload-traces/${id}`),
};

export const experimentsApi = {
  listConfigs: () => api.get<ExperimentConfigSummary[]>("/experiments/").then((r) => r.data),
  getConfig: (id: string) => api.get<ExperimentConfigResponse>(`/experiments/${id}`).then((r) => r.data),
  createConfig: (body: ExperimentConfigCreate) =>
    api.post<ExperimentConfigResponse>("/experiments/", body).then((r) => r.data),
  deleteConfig: (id: string) => api.delete(`/experiments/${id}`),
  triggerRun: (config_id: string) =>
    api.post<ExperimentRunSummary>(`/experiments/${config_id}/run`).then((r) => r.data),
  listRuns: (config_id: string) =>
    api.get<ExperimentRunSummary[]>(`/experiments/${config_id}/runs`).then((r) => r.data),
  getRun: (run_id: string) =>
    api.get<ExperimentRunResponse>(`/experiments/runs/${run_id}`).then((r) => r.data),
};
