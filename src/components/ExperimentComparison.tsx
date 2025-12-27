import { GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function ExperimentComparison({ experiments, selectedExperiments, onToggleSelection, onClearSelection }: any) {
  const selectedExperimentsData = experiments.filter((exp: any) =>
    selectedExperiments.includes(exp.id)
  );

  const comparisonChartData = selectedExperimentsData.map((exp: any) => ({
    name: exp.id,
    'Baseline Latency': exp.avgLatencyBaseline || 0,
    'DRL Latency': exp.avgLatencyDRL || 0,
    'Baseline Throughput': exp.throughputBaseline || 0,
    'DRL Throughput': exp.throughputDRL || 0,
    'Baseline Utilization': exp.utilizationBaseline || 0,
    'DRL Utilization': exp.utilizationDRL || 0,
  }));

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-lg">
            <GitCompare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-slate-900">Experiment Comparison</h2>
            <p className="text-slate-600">Select up to 3 experiments to compare side-by-side</p>
          </div>
        </div>
        {selectedExperiments.length > 0 && (
          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Experiment Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {experiments.filter((exp: any) => exp.status === 'completed').map((exp: any) => (
          <button
            key={exp.id}
            onClick={() => onToggleSelection(exp.id)}
            disabled={!selectedExperiments.includes(exp.id) && selectedExperiments.length >= 3}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedExperiments.includes(exp.id)
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-300 bg-white hover:border-indigo-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-slate-900">{exp.id}</div>
              {selectedExperiments.includes(exp.id) && (
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white">✓</span>
                </div>
              )}
            </div>
            <div className="text-slate-700 mb-2">{exp.name}</div>
            <div className="text-slate-600">{exp.date}</div>
            {exp.improvement && (
              <div className="text-green-600 mt-2">+{exp.improvement}% improvement</div>
            )}
          </button>
        ))}
      </div>

      {/* Comparison Visualizations */}
      {selectedExperimentsData.length > 0 && (
        <div className="space-y-6">
          {/* Side-by-Side Comparison Table */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-slate-900 mb-4">Metrics Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-700">Metric</th>
                    {selectedExperimentsData.map((exp: any) => (
                      <th key={exp.id} className="px-4 py-3 text-left text-slate-700">{exp.id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Cluster Size</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-slate-900">{exp.clusterSize} nodes</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Total Jobs</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-slate-900">{exp.totalJobs}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Baseline Latency</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-slate-900">
                        {exp.avgLatencyBaseline ? `${exp.avgLatencyBaseline}ms` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">DRL Latency</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-blue-600">
                        {exp.avgLatencyDRL ? `${exp.avgLatencyDRL}ms` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Baseline Throughput</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-slate-900">
                        {exp.throughputBaseline ? `${exp.throughputBaseline} jobs/s` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">DRL Throughput</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-green-600">
                        {exp.throughputDRL ? `${exp.throughputDRL} jobs/s` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Improvement</td>
                    {selectedExperimentsData.map((exp: any) => (
                      <td key={exp.id} className="px-4 py-3 text-green-600">
                        {exp.improvement ? `+${exp.improvement}%` : '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Comparison */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Latency Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Baseline Latency" fill="#94a3b8" />
                  <Bar dataKey="DRL Latency" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Throughput Comparison */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Throughput Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Baseline Throughput" fill="#94a3b8" />
                  <Bar dataKey="DRL Throughput" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Utilization Comparison */}
            <div className="bg-white rounded-lg p-6 lg:col-span-2">
              <h3 className="text-slate-900 mb-4">Resource Utilization Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Baseline Utilization" fill="#94a3b8" />
                  <Bar dataKey="DRL Utilization" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedExperimentsData.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <GitCompare className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600">Select experiments above to begin comparison</p>
          <p className="text-slate-500 mt-1">You can select up to 3 experiments</p>
        </div>
      )}
    </div>
  );
}
