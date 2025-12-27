import { useState } from 'react';
import { Play, Save, FileText, Settings, BarChart3, Download, Plus, GitCompare } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ExperimentComparison } from './ExperimentComparison';

export function ExperimentManagement({ schedulerType }: any) {
  const [config, setConfig] = useState({
    clusterSize: 8,
    nodeCapacityCpu: 16,
    nodeCapacityRam: 32,
    schedulingPolicy: 'drl',
    workloadPattern: 'uniform',
    jobArrivalRate: 5,
    experimentDuration: 3600,
  });

  const [experiments, setExperiments] = useState([
    {
      id: 'exp-001',
      name: 'Baseline vs DRL - Uniform Workload',
      status: 'completed',
      date: '2024-12-20',
      clusterSize: 8,
      totalJobs: 1000,
      scheduler: 'both',
      avgLatencyBaseline: 145.6,
      avgLatencyDRL: 98.4,
      improvement: 32.4,
      duration: 3600,
      throughputBaseline: 65.3,
      throughputDRL: 92.7,
      utilizationBaseline: 68.5,
      utilizationDRL: 84.2,
      makespanBaseline: 342.8,
      makespanDRL: 256.1,
    },
    {
      id: 'exp-002',
      name: 'DRL - High Contention Scenario',
      status: 'completed',
      date: '2024-12-22',
      clusterSize: 8,
      totalJobs: 1500,
      scheduler: 'drl',
      avgLatencyBaseline: 189.3,
      avgLatencyDRL: 112.7,
      improvement: 40.5,
      duration: 3600,
      throughputBaseline: 58.2,
      throughputDRL: 87.4,
      utilizationBaseline: 72.3,
      utilizationDRL: 88.6,
      makespanBaseline: 398.5,
      makespanDRL: 268.9,
    },
    {
      id: 'exp-003',
      name: 'Scalability Test - 16 Nodes',
      status: 'running',
      date: '2024-12-27',
      clusterSize: 16,
      totalJobs: 2500,
      scheduler: 'both',
      avgLatencyBaseline: null,
      avgLatencyDRL: null,
      improvement: null,
      duration: 7200,
      throughputBaseline: null,
      throughputDRL: null,
      utilizationBaseline: null,
      utilizationDRL: null,
      makespanBaseline: null,
      makespanDRL: null,
    },
  ]);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleRunExperiment = () => {
    const newExperiment = {
      id: `exp-${String(experiments.length + 1).padStart(3, '0')}`,
      name: `Experiment ${experiments.length + 1}`,
      status: 'running',
      date: new Date().toISOString().split('T')[0],
      clusterSize: config.clusterSize,
      totalJobs: 0,
      scheduler: config.schedulingPolicy,
      avgLatencyBaseline: null,
      avgLatencyDRL: null,
      improvement: null,
      duration: config.experimentDuration,
      throughputBaseline: null,
      throughputDRL: null,
      utilizationBaseline: null,
      utilizationDRL: null,
      makespanBaseline: null,
      makespanDRL: null,
    };

    setExperiments([newExperiment, ...experiments]);
    setShowConfigModal(false);
  };

  const toggleExperimentSelection = (expId: string) => {
    setSelectedExperiments((prev) =>
      prev.includes(expId)
        ? prev.filter((id) => id !== expId)
        : prev.length < 3
        ? [...prev, expId]
        : prev
    );
  };

  const selectedExperimentsData = experiments.filter((exp) =>
    selectedExperiments.includes(exp.id)
  );

  const comparisonChartData = selectedExperimentsData.map((exp) => ({
    name: exp.id,
    'Baseline Latency': exp.avgLatencyBaseline || 0,
    'DRL Latency': exp.avgLatencyDRL || 0,
    'Baseline Throughput': exp.throughputBaseline || 0,
    'DRL Throughput': exp.throughputDRL || 0,
    'Baseline Utilization': exp.utilizationBaseline || 0,
    'DRL Utilization': exp.utilizationDRL || 0,
  }));

  const workloadPatterns = ['uniform', 'bursty', 'periodic', 'mixed'];
  const schedulingPolicies = ['baseline', 'drl', 'both'];

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900">Experiment Configuration</h2>
            <p className="text-slate-600 mt-1">Configure simulation parameters for controlled experiments</p>
          </div>
          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Experiment</span>
          </button>
        </div>

        {showConfigModal && (
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cluster Size */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Cluster Size (Nodes)
                </label>
                <input
                  type="number"
                  value={config.clusterSize}
                  onChange={(e) => setConfig({ ...config, clusterSize: parseInt(e.target.value) })}
                  min="1"
                  max="128"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Node CPU Capacity */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Node CPU Capacity (cores)
                </label>
                <input
                  type="number"
                  value={config.nodeCapacityCpu}
                  onChange={(e) => setConfig({ ...config, nodeCapacityCpu: parseInt(e.target.value) })}
                  min="1"
                  max="128"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Node RAM Capacity */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Node RAM Capacity (GB)
                </label>
                <input
                  type="number"
                  value={config.nodeCapacityRam}
                  onChange={(e) => setConfig({ ...config, nodeCapacityRam: parseInt(e.target.value) })}
                  min="1"
                  max="512"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Scheduling Policy */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Scheduling Policy
                </label>
                <select
                  value={config.schedulingPolicy}
                  onChange={(e) => setConfig({ ...config, schedulingPolicy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {schedulingPolicies.map((policy) => (
                    <option key={policy} value={policy}>
                      {policy.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workload Pattern */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Workload Pattern
                </label>
                <select
                  value={config.workloadPattern}
                  onChange={(e) => setConfig({ ...config, workloadPattern: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {workloadPatterns.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Arrival Rate */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Job Arrival Rate (jobs/min)
                </label>
                <input
                  type="number"
                  value={config.jobArrivalRate}
                  onChange={(e) => setConfig({ ...config, jobArrivalRate: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Experiment Duration */}
              <div>
                <label className="block text-slate-700 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={config.experimentDuration}
                  onChange={(e) => setConfig({ ...config, experimentDuration: parseInt(e.target.value) })}
                  min="60"
                  max="86400"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRunExperiment}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Run Experiment</span>
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Current Configuration Summary */}
        {!showConfigModal && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-slate-600 mb-1">Cluster Size</div>
              <div className="text-slate-900">{config.clusterSize} nodes</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-slate-600 mb-1">Node Capacity</div>
              <div className="text-slate-900">{config.nodeCapacityCpu} CPU / {config.nodeCapacityRam}GB RAM</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-slate-600 mb-1">Workload Pattern</div>
              <div className="text-slate-900 capitalize">{config.workloadPattern}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-slate-600 mb-1">Arrival Rate</div>
              <div className="text-slate-900">{config.jobArrivalRate} jobs/min</div>
            </div>
          </div>
        )}
      </div>

      {/* Experiment History */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900">Experiment History</h2>
            <p className="text-slate-600 mt-1">View and analyze past experiment results</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
            <Download className="w-5 h-5" />
            <span>Export All</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700">Experiment ID</th>
                <th className="px-4 py-3 text-left text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-slate-700">Date</th>
                <th className="px-4 py-3 text-left text-slate-700">Cluster</th>
                <th className="px-4 py-3 text-left text-slate-700">Jobs</th>
                <th className="px-4 py-3 text-left text-slate-700">Baseline Latency</th>
                <th className="px-4 py-3 text-left text-slate-700">DRL Latency</th>
                <th className="px-4 py-3 text-left text-slate-700">Improvement</th>
                <th className="px-4 py-3 text-left text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{exp.id}</td>
                  <td className="px-4 py-3 text-slate-900">{exp.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${
                        exp.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : exp.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{exp.date}</td>
                  <td className="px-4 py-3 text-slate-700">{exp.clusterSize} nodes</td>
                  <td className="px-4 py-3 text-slate-700">{exp.totalJobs}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {exp.avgLatencyBaseline ? `${exp.avgLatencyBaseline}ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {exp.avgLatencyDRL ? `${exp.avgLatencyDRL}ms` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {exp.improvement ? (
                      <span className="text-green-600">+{exp.improvement}%</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-600 hover:bg-slate-50 rounded transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Experiment Metadata */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-4">Recent Experiment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-slate-700 mb-3">Configuration Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Experiment ID</span>
                <span className="text-slate-900">exp-001</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Scheduler Type</span>
                <span className="text-slate-900">Both (Baseline + DRL)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Workload Type</span>
                <span className="text-slate-900">Uniform Distribution</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Random Seed</span>
                <span className="text-slate-900">42</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-slate-700 mb-3">Performance Results</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Total Runtime</span>
                <span className="text-slate-900">3,600s</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Jobs Completed</span>
                <span className="text-slate-900">1,000</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Success Rate</span>
                <span className="text-green-600">99.2%</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Avg Improvement</span>
                <span className="text-green-600">+32.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controlled Experiment Setup */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-900">Controlled Experiment Guidelines</h3>
            <p className="text-slate-600">Best practices for fair scheduler comparison</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-slate-900 mb-2">✓ Use Identical Workloads</h4>
            <p className="text-slate-600">Run both schedulers with the same job sequences using fixed random seeds</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-slate-900 mb-2">✓ Control Variables</h4>
            <p className="text-slate-600">Keep cluster configuration, node capacities, and arrival patterns constant</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-slate-900 mb-2">✓ Multiple Runs</h4>
            <p className="text-slate-600">Execute 3-5 runs per configuration to account for variance</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-slate-900 mb-2">✓ Comprehensive Metrics</h4>
            <p className="text-slate-600">Track latency, throughput, utilization, and fairness metrics</p>
          </div>
        </div>
      </div>

      {/* Experiment Comparison */}
      {showComparison && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-slate-900 mb-4">Experiment Comparison</h2>
          <ExperimentComparison data={comparisonChartData} />
        </div>
      )}
    </div>
  );
}