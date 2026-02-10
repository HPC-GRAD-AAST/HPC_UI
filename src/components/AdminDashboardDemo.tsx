import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  Server,
} from "lucide-react";
import { useState } from "react";

const MOCK_METRICS = [
  {
    time: "14:25:00",
    latency: 145,
    throughput: 65,
    makespan: 340,
    waitTime: 88,
    cpuUtil: 65,
    ramUtil: 58,
  },
  {
    time: "14:25:30",
    latency: 138,
    throughput: 68,
    makespan: 335,
    waitTime: 85,
    cpuUtil: 68,
    ramUtil: 61,
  },
  {
    time: "14:26:00",
    latency: 132,
    throughput: 71,
    makespan: 328,
    waitTime: 82,
    cpuUtil: 72,
    ramUtil: 65,
  },
  {
    time: "14:26:30",
    latency: 128,
    throughput: 75,
    makespan: 320,
    waitTime: 78,
    cpuUtil: 75,
    ramUtil: 68,
  },
  {
    time: "14:27:00",
    latency: 125,
    throughput: 78,
    makespan: 315,
    waitTime: 75,
    cpuUtil: 78,
    ramUtil: 71,
  },
  {
    time: "14:27:30",
    latency: 122,
    throughput: 81,
    makespan: 310,
    waitTime: 72,
    cpuUtil: 81,
    ramUtil: 74,
  },
  {
    time: "14:28:00",
    latency: 120,
    throughput: 84,
    makespan: 305,
    waitTime: 70,
    cpuUtil: 84,
    ramUtil: 77,
  },
  {
    time: "14:28:30",
    latency: 118,
    throughput: 87,
    makespan: 300,
    waitTime: 68,
    cpuUtil: 87,
    ramUtil: 79,
  },
  {
    time: "14:29:00",
    latency: 115,
    throughput: 89,
    makespan: 298,
    waitTime: 65,
    cpuUtil: 89,
    ramUtil: 81,
  },
  {
    time: "14:29:30",
    latency: 117,
    throughput: 88,
    makespan: 302,
    waitTime: 67,
    cpuUtil: 87,
    ramUtil: 79,
  },
  {
    time: "14:30:00",
    latency: 120,
    throughput: 86,
    makespan: 305,
    waitTime: 69,
    cpuUtil: 85,
    ramUtil: 78,
  },
];

const MOCK_HEATMAP = [
  { node: "N1", cpu: 87, ram: 88, jobs: 3 },
  { node: "N2", cpu: 75, ram: 76, jobs: 3 },
  { node: "N3", cpu: 50, ram: 56, jobs: 1 },
  { node: "N4", cpu: 69, ram: 63, jobs: 2 },
  { node: "N5", cpu: 93, ram: 91, jobs: 3 },
  { node: "N6", cpu: 37, ram: 38, jobs: 1 },
  { node: "N7", cpu: 56, ram: 50, jobs: 1 },
  { node: "N8", cpu: 81, ram: 81, jobs: 2 },
];

const MOCK_COMPARISON = {
  baseline: {
    avgLatency: 145.6,
    avgThroughput: 65.3,
    avgMakespan: 342.8,
    avgWaitTime: 89.2,
    utilization: 68.5,
  },
  drl: {
    avgLatency: 98.4,
    avgThroughput: 92.7,
    avgMakespan: 256.1,
    avgWaitTime: 45.3,
    utilization: 84.2,
  },
  improvement: {
    latency: 32.4,
    throughput: 42.0,
    makespan: 25.3,
    waitTime: 49.2,
    utilization: 22.9,
  },
};

export function AdminDashboardDemo() {
  const [schedulerType] = useState("drl");

  const radarData = [
    {
      metric: "Throughput",
      Baseline: MOCK_COMPARISON.baseline.avgThroughput,
      DRL: MOCK_COMPARISON.drl.avgThroughput,
    },
    {
      metric: "Utilization",
      Baseline: MOCK_COMPARISON.baseline.utilization,
      DRL: MOCK_COMPARISON.drl.utilization,
    },
    {
      metric: "Latency (inv)",
      Baseline: 200 - MOCK_COMPARISON.baseline.avgLatency,
      DRL: 200 - MOCK_COMPARISON.drl.avgLatency,
    },
    {
      metric: "Wait Time (inv)",
      Baseline: 100 - MOCK_COMPARISON.baseline.avgWaitTime,
      DRL: 100 - MOCK_COMPARISON.drl.avgWaitTime,
    },
    {
      metric: "Makespan (inv)",
      Baseline: 400 - MOCK_COMPARISON.baseline.avgMakespan,
      DRL: 400 - MOCK_COMPARISON.drl.avgMakespan,
    },
  ];

  const statCards = [
    {
      label: "Active Jobs",
      value: 14,
      icon: Activity,
      color: "blue",
      change: "+12%",
      trend: "up",
    },
    {
      label: "Avg Latency",
      value: `${MOCK_COMPARISON.drl.avgLatency.toFixed(1)}ms`,
      icon: Clock,
      color: "green",
      change: "-32%",
      trend: "down",
    },
    {
      label: "Throughput",
      value: `${MOCK_COMPARISON.drl.avgThroughput.toFixed(1)} jobs/s`,
      icon: Zap,
      color: "purple",
      change: "+42%",
      trend: "up",
    },
    {
      label: "Cluster Utilization",
      value: `${MOCK_COMPARISON.drl.utilization.toFixed(1)}%`,
      icon: Server,
      color: "yellow",
      change: "+23%",
      trend: "up",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900">
                Cluster Scheduling Simulation Platform
              </h1>
              <p className="text-slate-600 mt-1">
                Advanced DRL-Based Job Scheduling & Performance Analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-700 capitalize">running</span>
              </div>
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                Scheduler: <span className="font-medium uppercase">drl</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="space-y-6">
          {/* Real-Time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              const colorClasses: any = {
                blue: "bg-blue-50 text-blue-600",
                green: "bg-green-50 text-green-600",
                purple: "bg-purple-50 text-purple-600",
                yellow: "bg-yellow-50 text-yellow-600",
              };

              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg border border-slate-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-600 mb-2">{stat.label}</p>
                      <p className="text-slate-900 mb-2">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" ? (
                          <TrendingUp
                            className={`w-4 h-4 ${
                              stat.change.startsWith("+")
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        )}
                        <span
                          className={`${
                            stat.change.startsWith("+")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${colorClasses[stat.color]}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">
                Job Latency & Throughput (Real-Time)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={MOCK_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Latency (ms)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="throughput"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Throughput (jobs/s)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">
                Makespan & Wait Time (Real-Time)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={MOCK_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="makespan"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Makespan (s)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="waitTime"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Wait Time (s)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Heatmap */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-4">Cluster Resource Heatmap</h3>
            <div className="grid grid-cols-8 gap-4">
              {MOCK_HEATMAP.map((node) => {
                const intensity = (node.cpu + node.ram) / 2;
                const bgColor =
                  intensity > 80
                    ? "bg-red-500"
                    : intensity > 60
                    ? "bg-orange-500"
                    : intensity > 40
                    ? "bg-yellow-500"
                    : intensity > 20
                    ? "bg-blue-500"
                    : "bg-green-500";

                return (
                  <div key={node.node} className="text-center">
                    <div
                      className={`${bgColor} text-white rounded-lg p-6 mb-2 transition-all`}
                    >
                      <div className="mb-2">{node.node}</div>
                      <div className="text-xs opacity-90">
                        {intensity.toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      CPU: {node.cpu.toFixed(0)}%<br />
                      RAM: {node.ram.toFixed(0)}%<br />
                      Jobs: {node.jobs}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparative Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">
                Scheduler Performance Comparison
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Baseline"
                    dataKey="Baseline"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="DRL Scheduler"
                    dataKey="DRL"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">
                Performance Improvements (DRL vs Baseline)
              </h3>
              <div className="space-y-4">
                {Object.entries(MOCK_COMPARISON.improvement).map(
                  ([key, value]: [string, any]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-green-600">
                          +{value.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Statistical Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-4">Statistical Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-slate-600 mb-2">Total Jobs Processed</div>
                <div className="text-slate-900">2,145</div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 mb-2">Success Rate</div>
                <div className="text-green-600">98.7%</div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 mb-2">Avg Response Time</div>
                <div className="text-slate-900">98.4ms</div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 mb-2">Peak Throughput</div>
                <div className="text-slate-900">92.7 jobs/s</div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 mb-2">Uptime</div>
                <div className="text-green-600">99.9%</div>
              </div>
            </div>
          </div>

          {/* Resource Utilization Trends */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-4">Resource Utilization Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_METRICS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="cpuUtil"
                  fill="#3b82f6"
                  name="CPU Utilization %"
                />
                <Bar
                  dataKey="ramUtil"
                  fill="#10b981"
                  name="RAM Utilization %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
