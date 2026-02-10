import { useState } from "react";
import {
  Pause,
  RotateCcw,
  Cpu,
  MemoryStick,
  Server,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Node {
  id: number;
  cpuTotal: number;
  cpuUsed: number;
  ramTotal: number;
  ramUsed: number;
  jobs: string[];
  throttled: boolean;
  contention: number;
}

const MOCK_NODES: Node[] = [
  {
    id: 1,
    cpuTotal: 16,
    cpuUsed: 14,
    ramTotal: 32,
    ramUsed: 28,
    jobs: ["job-4521", "job-4522"],
    throttled: true,
    contention: 0.92,
  },
  {
    id: 2,
    cpuTotal: 16,
    cpuUsed: 12,
    ramTotal: 32,
    ramUsed: 24,
    jobs: ["job-4515", "job-4516", "job-4517"],
    throttled: true,
    contention: 0.88,
  },
  {
    id: 3,
    cpuTotal: 16,
    cpuUsed: 8,
    ramTotal: 32,
    ramUsed: 18,
    jobs: ["job-4519"],
    throttled: false,
    contention: 0.45,
  },
  {
    id: 4,
    cpuTotal: 16,
    cpuUsed: 11,
    ramTotal: 32,
    ramUsed: 20,
    jobs: ["job-4520", "job-4518"],
    throttled: false,
    contention: 0.62,
  },
  {
    id: 5,
    cpuTotal: 16,
    cpuUsed: 15,
    ramTotal: 32,
    ramUsed: 29,
    jobs: ["job-4523", "job-4524"],
    throttled: true,
    contention: 0.95,
  },
  {
    id: 6,
    cpuTotal: 16,
    cpuUsed: 6,
    ramTotal: 32,
    ramUsed: 12,
    jobs: ["job-4514"],
    throttled: false,
    contention: 0.35,
  },
  {
    id: 7,
    cpuTotal: 16,
    cpuUsed: 9,
    ramTotal: 32,
    ramUsed: 16,
    jobs: ["job-4525"],
    throttled: false,
    contention: 0.48,
  },
  {
    id: 8,
    cpuTotal: 16,
    cpuUsed: 13,
    ramTotal: 32,
    ramUsed: 26,
    jobs: ["job-4526", "job-4527"],
    throttled: false,
    contention: 0.78,
  },
];

const MOCK_QUEUE = [
  { id: "job-4528", cpu: 4, ram: 8, priority: "high", submitTime: "14:32:45" },
  {
    id: "job-4529",
    cpu: 2,
    ram: 4,
    priority: "medium",
    submitTime: "14:33:12",
  },
  { id: "job-4530", cpu: 3, ram: 6, priority: "low", submitTime: "14:33:28" },
  { id: "job-4531", cpu: 5, ram: 10, priority: "high", submitTime: "14:34:01" },
];

const MOCK_PERFORMANCE_DATA = [
  { time: "14:25:00", cpu: 65.2, ram: 58.3, throttled: 1, contention: 52.1 },
  { time: "14:25:30", cpu: 68.5, ram: 61.2, throttled: 1, contention: 55.3 },
  { time: "14:26:00", cpu: 72.1, ram: 64.8, throttled: 2, contention: 61.2 },
  { time: "14:26:30", cpu: 75.3, ram: 68.2, throttled: 2, contention: 65.8 },
  { time: "14:27:00", cpu: 78.4, ram: 71.5, throttled: 3, contention: 69.2 },
  { time: "14:27:30", cpu: 81.2, ram: 74.1, throttled: 3, contention: 72.1 },
  { time: "14:28:00", cpu: 84.1, ram: 76.8, throttled: 4, contention: 75.3 },
  { time: "14:28:30", cpu: 87.3, ram: 79.2, throttled: 5, contention: 78.5 },
  { time: "14:29:00", cpu: 89.2, ram: 81.5, throttled: 5, contention: 80.2 },
  { time: "14:29:30", cpu: 86.5, ram: 78.9, throttled: 4, contention: 77.8 },
  { time: "14:30:00", cpu: 83.2, ram: 76.2, throttled: 4, contention: 75.1 },
  { time: "14:30:30", cpu: 85.1, ram: 77.8, throttled: 5, contention: 76.8 },
  { time: "14:31:00", cpu: 82.9, ram: 75.5, throttled: 4, contention: 74.5 },
  { time: "14:31:30", cpu: 84.5, ram: 77.2, throttled: 4, contention: 76.2 },
  { time: "14:32:00", cpu: 86.2, ram: 78.9, throttled: 5, contention: 77.9 },
  { time: "14:32:30", cpu: 83.8, ram: 76.1, throttled: 4, contention: 75.3 },
];

const MOCK_LOGS = [
  {
    id: 1,
    timestamp: "14:34:28",
    type: "placement",
    message: "Job job-4527 placed on Node 8",
    jobId: "job-4527",
    nodeId: 8,
    cpuAllocated: 2,
    ramAllocated: 4,
    scheduler: "drl",
    prediction: "Low contention (78%)",
  },
  {
    id: 2,
    timestamp: "14:34:15",
    type: "completion",
    message: "Node 6: Job job-4513 completed, released 4 CPU, 8GB RAM",
    nodeId: 6,
    cpuReleased: 4,
    ramReleased: 8,
  },
  {
    id: 3,
    timestamp: "14:34:02",
    type: "placement",
    message: "Job job-4526 placed on Node 8",
    jobId: "job-4526",
    nodeId: 8,
    cpuAllocated: 3,
    ramAllocated: 6,
    scheduler: "drl",
    prediction: "Balanced contention (74%)",
  },
  {
    id: 4,
    timestamp: "14:33:48",
    type: "warning",
    message: "Job job-4531: Insufficient resources, waiting in queue",
    jobId: "job-4531",
    cpuRequired: 5,
    ramRequired: 10,
  },
  {
    id: 5,
    timestamp: "14:33:32",
    type: "placement",
    message: "Job job-4525 placed on Node 7",
    jobId: "job-4525",
    nodeId: 7,
    cpuAllocated: 3,
    ramAllocated: 6,
    scheduler: "drl",
    prediction: "Low contention (48%)",
  },
  {
    id: 6,
    timestamp: "14:33:18",
    type: "placement",
    message: "Job job-4524 placed on Node 5",
    jobId: "job-4524",
    nodeId: 5,
    cpuAllocated: 5,
    ramAllocated: 10,
    scheduler: "drl",
    prediction: "High contention (95%)",
  },
  {
    id: 7,
    timestamp: "14:33:05",
    type: "placement",
    message: "Job job-4523 placed on Node 5",
    jobId: "job-4523",
    nodeId: 5,
    cpuAllocated: 4,
    ramAllocated: 8,
    scheduler: "drl",
    prediction: "High contention (92%)",
  },
  {
    id: 8,
    timestamp: "14:32:50",
    type: "completion",
    message: "Node 3: Job job-4512 completed, released 4 CPU, 8GB RAM",
    nodeId: 3,
    cpuReleased: 4,
    ramReleased: 8,
  },
  {
    id: 9,
    timestamp: "14:32:35",
    type: "placement",
    message: "Job job-4522 placed on Node 1",
    jobId: "job-4522",
    nodeId: 1,
    cpuAllocated: 4,
    ramAllocated: 8,
    scheduler: "drl",
    prediction: "High contention (92%)",
  },
  {
    id: 10,
    timestamp: "14:32:20",
    type: "placement",
    message: "Job job-4521 placed on Node 1",
    jobId: "job-4521",
    nodeId: 1,
    cpuAllocated: 4,
    ramAllocated: 8,
    scheduler: "drl",
    prediction: "High contention (88%)",
  },
];

export function ClusterSimulationDemo() {
  const [nodes] = useState<Node[]>(MOCK_NODES);
  const [queue] = useState<any[]>(MOCK_QUEUE);
  const [logs] = useState<any[]>(MOCK_LOGS);
  const [performanceData] = useState<any[]>(MOCK_PERFORMANCE_DATA);
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortConfig.direction === "asc") {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">Simulation Controls</h2>
            <p className="text-slate-600 mt-1">
              Manage cluster simulation execution
            </p>
          </div>
          <div className="flex gap-3">
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-yellow-600 text-white opacity-50 cursor-not-allowed"
            >
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </button>
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg opacity-50 cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">
            Cluster Nodes (Homogeneous Configuration)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {nodes.map((node) => {
              const cpuPercent = (node.cpuUsed / node.cpuTotal) * 100;
              const ramPercent = (node.ramUsed / node.ramTotal) * 100;

              return (
                <div
                  key={node.id}
                  className={`border-2 rounded-lg p-4 ${
                    node.throttled
                      ? "border-red-500 bg-red-50"
                      : cpuPercent > 70
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-700" />
                      <span className="text-slate-900">Node {node.id}</span>
                    </div>
                    {node.throttled && (
                      <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-700">CPU</span>
                      </div>
                      <span className="text-slate-600">
                        {node.cpuUsed}/{node.cpuTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cpuPercent > 85
                            ? "bg-red-600"
                            : cpuPercent > 70
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <MemoryStick className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-700">RAM</span>
                      </div>
                      <span className="text-slate-600">
                        {node.ramUsed}/{node.ramTotal}GB
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ramPercent > 90
                            ? "bg-red-600"
                            : ramPercent > 70
                            ? "bg-yellow-600"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${ramPercent}%` }}
                      />
                    </div>
                  </div>

                  {node.contention > 0 && (
                    <div className="text-xs text-slate-600 mt-2">
                      Contention: {(node.contention * 100).toFixed(0)}%
                    </div>
                  )}
                  <div className="text-xs text-slate-600 mt-2">
                    Jobs: {node.jobs.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Job Queue</h3>
          <div className="text-slate-600 mb-4">{queue.length} jobs waiting</div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((job, idx) => (
              <div
                key={job.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-900">
                    #{idx + 1} - {job.id}
                  </span>
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    Queued
                  </span>
                </div>
                <div className="text-sm text-blue-800">
                  CPU: {job.cpu} cores | RAM: {job.ram}GB
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">
            Resource Utilization Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="CPU %"
              />
              <Area
                type="monotone"
                dataKey="ram"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                name="RAM %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">
            Non-Linear Performance Effects
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="throttled" fill="#ef4444" name="Throttled Nodes" />
              <Bar
                dataKey="contention"
                fill="#f59e0b"
                name="Memory Contention %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">
          Execution Logs & Placement Decisions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-slate-700 cursor-pointer"
                  onClick={() =>
                    setSortConfig({
                      key: "timestamp",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-slate-700">Type</th>
                <th className="px-4 py-3 text-left text-slate-700">Message</th>
                <th className="px-4 py-3 text-left text-slate-700">
                  Resources
                </th>
                <th className="px-4 py-3 text-left text-slate-700">
                  Scheduler Decision
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        log.type === "placement"
                          ? "bg-green-100 text-green-800"
                          : log.type === "completion"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.message}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.cpuAllocated && `CPU: ${log.cpuAllocated}`}
                    {log.cpuReleased && `CPU: -${log.cpuReleased}`}
                    {log.ramAllocated && ` | RAM: ${log.ramAllocated}GB`}
                    {log.ramReleased && ` | RAM: -${log.ramReleased}GB`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.scheduler && (
                      <div>
                        <div className="text-slate-900">
                          {log.scheduler.toUpperCase()}
                        </div>
                        {log.prediction && (
                          <div className="text-xs text-slate-600">
                            {log.prediction}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
