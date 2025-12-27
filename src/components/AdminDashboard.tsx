import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, Zap, Server } from 'lucide-react';

export function AdminDashboard({ jobs, schedulerType, simulationState }: any) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    // Generate historical metrics
    const generateMetrics = () => {
      const newMetric = {
        time: new Date().toLocaleTimeString(),
        latency: Math.random() * 100 + (schedulerType === 'drl' ? 50 : 100),
        throughput: Math.random() * 50 + (schedulerType === 'drl' ? 70 : 50),
        makespan: Math.random() * 200 + (schedulerType === 'drl' ? 150 : 200),
        waitTime: Math.random() * 80 + (schedulerType === 'drl' ? 30 : 60),
        cpuUtil: Math.random() * 30 + 60,
        ramUtil: Math.random() * 25 + 55,
      };

      setMetrics((prev) => [...prev.slice(-19), newMetric]);
    };

    if (simulationState === 'running') {
      const interval = setInterval(generateMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [simulationState, schedulerType]);

  useEffect(() => {
    // Generate heatmap data (node utilization)
    const generateHeatmap = () => {
      const data = Array.from({ length: 8 }, (_, i) => ({
        node: `N${i + 1}`,
        cpu: Math.random() * 100,
        ram: Math.random() * 100,
        jobs: Math.floor(Math.random() * 10),
      }));
      setHeatmapData(data);
    };

    if (simulationState === 'running') {
      const interval = setInterval(generateHeatmap, 5000);
      generateHeatmap();
      return () => clearInterval(interval);
    }
  }, [simulationState]);

  useEffect(() => {
    // Generate comparison data
    setComparisonData({
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
    });
  }, []);

  const radarData = comparisonData
    ? [
        {
          metric: 'Throughput',
          Baseline: comparisonData.baseline.avgThroughput,
          DRL: comparisonData.drl.avgThroughput,
        },
        {
          metric: 'Utilization',
          Baseline: comparisonData.baseline.utilization,
          DRL: comparisonData.drl.utilization,
        },
        {
          metric: 'Latency (inv)',
          Baseline: 200 - comparisonData.baseline.avgLatency,
          DRL: 200 - comparisonData.drl.avgLatency,
        },
        {
          metric: 'Wait Time (inv)',
          Baseline: 100 - comparisonData.baseline.avgWaitTime,
          DRL: 100 - comparisonData.drl.avgWaitTime,
        },
        {
          metric: 'Makespan (inv)',
          Baseline: 400 - comparisonData.baseline.avgMakespan,
          DRL: 400 - comparisonData.drl.avgMakespan,
        },
      ]
    : [];

  const statCards = [
    {
      label: 'Active Jobs',
      value: jobs.length,
      icon: Activity,
      color: 'blue',
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Avg Latency',
      value: comparisonData ? `${comparisonData[schedulerType === 'drl' ? 'drl' : 'baseline'].avgLatency.toFixed(1)}ms` : '0ms',
      icon: Clock,
      color: 'green',
      change: schedulerType === 'drl' ? '-32%' : '+5%',
      trend: schedulerType === 'drl' ? 'down' : 'up',
    },
    {
      label: 'Throughput',
      value: comparisonData ? `${comparisonData[schedulerType === 'drl' ? 'drl' : 'baseline'].avgThroughput.toFixed(1)} jobs/s` : '0',
      icon: Zap,
      color: 'purple',
      change: schedulerType === 'drl' ? '+42%' : '+8%',
      trend: 'up',
    },
    {
      label: 'Cluster Utilization',
      value: comparisonData ? `${comparisonData[schedulerType === 'drl' ? 'drl' : 'baseline'].utilization.toFixed(1)}%` : '0%',
      icon: Server,
      color: 'yellow',
      change: schedulerType === 'drl' ? '+23%' : '+3%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            yellow: 'bg-yellow-50 text-yellow-600',
          };

          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 mb-2">{stat.label}</p>
                  <p className="text-slate-900 mb-2">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' && stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    )}
                    <span className={`${stat.trend === 'up' && stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
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
          <h3 className="text-slate-900 mb-4">Job Latency & Throughput (Real-Time)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} name="Latency (ms)" dot={false} />
              <Line type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} name="Throughput (jobs/s)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Makespan & Wait Time (Real-Time)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="makespan" stroke="#f59e0b" strokeWidth={2} name="Makespan (s)" dot={false} />
              <Line type="monotone" dataKey="waitTime" stroke="#ef4444" strokeWidth={2} name="Wait Time (s)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cluster Heatmap */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Cluster Resource Heatmap</h3>
        <div className="grid grid-cols-8 gap-4">
          {heatmapData.map((node) => {
            const intensity = (node.cpu + node.ram) / 2;
            const bgColor =
              intensity > 80
                ? 'bg-red-500'
                : intensity > 60
                ? 'bg-orange-500'
                : intensity > 40
                ? 'bg-yellow-500'
                : intensity > 20
                ? 'bg-blue-500'
                : 'bg-green-500';

            return (
              <div key={node.node} className="text-center">
                <div className={`${bgColor} text-white rounded-lg p-6 mb-2 transition-all`}>
                  <div className="mb-2">{node.node}</div>
                  <div className="text-xs opacity-90">{intensity.toFixed(0)}%</div>
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
          <h3 className="text-slate-900 mb-4">Scheduler Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar name="Baseline" dataKey="Baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
              <Radar name="DRL Scheduler" dataKey="DRL" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Performance Improvements (DRL vs Baseline)</h3>
          {comparisonData && (
            <div className="space-y-4">
              {Object.entries(comparisonData.improvement).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-green-600">+{value.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistical Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Statistical Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-slate-600 mb-2">Total Jobs Processed</div>
            <div className="text-slate-900">{jobs.length * 15}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-600 mb-2">Success Rate</div>
            <div className="text-green-600">98.7%</div>
          </div>
          <div className="text-center">
            <div className="text-slate-600 mb-2">Avg Response Time</div>
            <div className="text-slate-900">124.3ms</div>
          </div>
          <div className="text-center">
            <div className="text-slate-600 mb-2">Peak Throughput</div>
            <div className="text-slate-900">156 jobs/s</div>
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
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cpuUtil" fill="#3b82f6" name="CPU Utilization %" />
            <Bar dataKey="ramUtil" fill="#10b981" name="RAM Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
