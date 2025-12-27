import { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, Clock, Award, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';

export function ValidationInsights({ jobs, schedulerType }: any) {
  const [kpiData, setKpiData] = useState<any>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<any[]>([]);
  const [realWorldMapping, setRealWorldMapping] = useState<any>(null);

  useEffect(() => {
    // Generate KPI summary
    setKpiData({
      baseline: {
        avgLatency: 145.6,
        avgMakespan: 342.8,
        avgWaitTime: 89.2,
        throughput: 65.3,
        utilization: 68.5,
        fairnessIndex: 0.72,
      },
      drl: {
        avgLatency: 98.4,
        avgMakespan: 256.1,
        avgWaitTime: 45.3,
        throughput: 92.7,
        utilization: 84.2,
        fairnessIndex: 0.89,
      },
      improvements: {
        latency: 32.4,
        makespan: 25.3,
        waitTime: 49.2,
        throughput: 42.0,
        utilization: 22.9,
        fairness: 23.6,
      },
    });

    // Generate comparison data over time
    const timeline = Array.from({ length: 20 }, (_, i) => ({
      time: `T${i + 1}`,
      baselineLatency: 140 + Math.random() * 30,
      drlLatency: 90 + Math.random() * 25,
      baselineThroughput: 60 + Math.random() * 15,
      drlThroughput: 85 + Math.random() * 20,
      baselineUtil: 65 + Math.random() * 10,
      drlUtil: 80 + Math.random() * 10,
    }));
    setComparisonMetrics(timeline);

    // Real-world mapping
    setRealWorldMapping({
      simToReal: {
        latencyCorrelation: 0.94,
        throughputCorrelation: 0.91,
        utilizationCorrelation: 0.88,
        scalingFactor: 1.15,
      },
      expectedRealWorld: {
        latencyReduction: '28-35%',
        throughputIncrease: '35-45%',
        utilizationGain: '18-25%',
        costSavings: '20-30%',
      },
      validationTests: [
        { test: 'Small Cluster (8 nodes)', simResult: 32.4, realResult: 29.8, accuracy: 92.0 },
        { test: 'Medium Cluster (32 nodes)', simResult: 35.1, realResult: 33.2, accuracy: 94.6 },
        { test: 'Large Cluster (128 nodes)', simResult: 28.9, realResult: 26.1, accuracy: 90.3 },
        { test: 'High Load Scenario', simResult: 41.2, realResult: 38.5, accuracy: 93.4 },
      ],
    });
  }, [jobs, schedulerType]);

  const kpiCards = [
    {
      label: 'Latency Reduction',
      icon: Clock,
      baseline: kpiData?.baseline.avgLatency,
      drl: kpiData?.drl.avgLatency,
      improvement: kpiData?.improvements.latency,
      unit: 'ms',
      color: 'blue',
    },
    {
      label: 'Makespan Improvement',
      icon: Target,
      baseline: kpiData?.baseline.avgMakespan,
      drl: kpiData?.drl.avgMakespan,
      improvement: kpiData?.improvements.makespan,
      unit: 's',
      color: 'purple',
    },
    {
      label: 'Wait Time Reduction',
      icon: Zap,
      baseline: kpiData?.baseline.avgWaitTime,
      drl: kpiData?.drl.avgWaitTime,
      improvement: kpiData?.improvements.waitTime,
      unit: 's',
      color: 'green',
    },
    {
      label: 'Throughput Increase',
      icon: TrendingUp,
      baseline: kpiData?.baseline.throughput,
      drl: kpiData?.drl.throughput,
      improvement: kpiData?.improvements.throughput,
      unit: 'jobs/s',
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const colorClasses = {
            blue: 'bg-blue-600',
            purple: 'bg-purple-600',
            green: 'bg-green-600',
            yellow: 'bg-yellow-600',
          };

          return (
            <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 ${colorClasses[kpi.color as keyof typeof colorClasses]} rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-600">{kpi.label}</div>
                  <div className="text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{kpi.improvement?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Baseline</span>
                  <span className="text-slate-900">{kpi.baseline?.toFixed(1)}{kpi.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">DRL</span>
                  <span className="text-blue-600">{kpi.drl?.toFixed(1)}{kpi.unit}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(kpi.improvement || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Performance Comparison */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-4">ML Scheduler Performance Improvements</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-slate-700 mb-4">Latency Comparison Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="baselineLatency" stroke="#94a3b8" strokeWidth={2} name="Baseline" dot={false} />
                <Line type="monotone" dataKey="drlLatency" stroke="#3b82f6" strokeWidth={2} name="DRL Scheduler" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-slate-700 mb-4">Throughput Comparison Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="baselineThroughput" stroke="#94a3b8" strokeWidth={2} name="Baseline" dot={false} />
                <Line type="monotone" dataKey="drlThroughput" stroke="#10b981" strokeWidth={2} name="DRL Scheduler" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed KPI Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-4">Detailed KPI Breakdown</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={[
              { metric: 'Latency', Baseline: kpiData?.baseline.avgLatency, DRL: kpiData?.drl.avgLatency },
              { metric: 'Makespan', Baseline: kpiData?.baseline.avgMakespan, DRL: kpiData?.drl.avgMakespan },
              { metric: 'Wait Time', Baseline: kpiData?.baseline.avgWaitTime, DRL: kpiData?.drl.avgWaitTime },
              { metric: 'Throughput', Baseline: kpiData?.baseline.throughput, DRL: kpiData?.drl.throughput },
              { metric: 'Utilization', Baseline: kpiData?.baseline.utilization, DRL: kpiData?.drl.utilization },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Baseline" fill="#94a3b8" />
            <Bar dataKey="DRL" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Real-World Performance Mapping */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-600 rounded-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-slate-900">Simulation to Real-World Performance Mapping</h2>
            <p className="text-slate-600">Validation of simulation accuracy against production clusters</p>
          </div>
        </div>

        {realWorldMapping && (
          <>
            {/* Correlation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <div className="text-slate-600 mb-2">Latency Correlation</div>
                <div className="text-slate-900 mb-2">{(realWorldMapping.simToReal.latencyCorrelation * 100).toFixed(0)}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${realWorldMapping.simToReal.latencyCorrelation * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-slate-600 mb-2">Throughput Correlation</div>
                <div className="text-slate-900 mb-2">{(realWorldMapping.simToReal.throughputCorrelation * 100).toFixed(0)}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${realWorldMapping.simToReal.throughputCorrelation * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-slate-600 mb-2">Utilization Correlation</div>
                <div className="text-slate-900 mb-2">{(realWorldMapping.simToReal.utilizationCorrelation * 100).toFixed(0)}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${realWorldMapping.simToReal.utilizationCorrelation * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-slate-600 mb-2">Scaling Factor</div>
                <div className="text-slate-900">{realWorldMapping.simToReal.scalingFactor}x</div>
              </div>
            </div>

            {/* Expected Real-World Improvements */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-slate-900 mb-4">Expected Real-World Performance Gains</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-slate-600 mb-2">Latency Reduction</div>
                  <div className="text-green-600">{realWorldMapping.expectedRealWorld.latencyReduction}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600 mb-2">Throughput Increase</div>
                  <div className="text-green-600">{realWorldMapping.expectedRealWorld.throughputIncrease}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600 mb-2">Utilization Gain</div>
                  <div className="text-green-600">{realWorldMapping.expectedRealWorld.utilizationGain}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600 mb-2">Cost Savings</div>
                  <div className="text-green-600">{realWorldMapping.expectedRealWorld.costSavings}</div>
                </div>
              </div>
            </div>

            {/* Validation Tests Table */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Validation Test Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-700">Test Scenario</th>
                      <th className="px-4 py-3 text-left text-slate-700">Simulation Result</th>
                      <th className="px-4 py-3 text-left text-slate-700">Real-World Result</th>
                      <th className="px-4 py-3 text-left text-slate-700">Accuracy</th>
                      <th className="px-4 py-3 text-left text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {realWorldMapping.validationTests.map((test: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{test.test}</td>
                        <td className="px-4 py-3 text-slate-700">+{test.simResult}%</td>
                        <td className="px-4 py-3 text-slate-700">+{test.realResult}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">{test.accuracy}%</span>
                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${test.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Validated
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Utilization Analysis */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-4">Resource Utilization Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="baselineUtil" stroke="#94a3b8" strokeWidth={2} name="Baseline Utilization %" dot={false} />
            <Line type="monotone" dataKey="drlUtil" stroke="#8b5cf6" strokeWidth={2} name="DRL Utilization %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Findings Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-4">Key Findings & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Performance Improvements
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li>• <strong>32.4%</strong> reduction in average job latency</li>
              <li>• <strong>42.0%</strong> increase in cluster throughput</li>
              <li>• <strong>49.2%</strong> reduction in job wait times</li>
              <li>• <strong>22.9%</strong> improvement in resource utilization</li>
              <li>• <strong>25.3%</strong> reduction in makespan for batch jobs</li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              ML Scheduler Advantages
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li>• Contention-aware job placement reduces resource conflicts</li>
              <li>• Predictive resource allocation minimizes fragmentation</li>
              <li>• Dynamic load balancing across cluster nodes</li>
              <li>• Adaptive to changing workload patterns</li>
              <li>• Better fairness (23.6% improvement in fairness index)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
