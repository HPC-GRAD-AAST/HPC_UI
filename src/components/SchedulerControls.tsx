import { useState, useEffect } from 'react';
import { Settings, Cpu, TrendingUp, Brain, Target, BarChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function SchedulerControls({ schedulerType, onSchedulerChange, jobs }: any) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<any[]>([]);
  const [mlMetrics, setMlMetrics] = useState<any>(null);

  useEffect(() => {
    // Generate ML predictions
    const generatePredictions = () => {
      const nodes = Array.from({ length: 8 }, (_, i) => ({
        nodeId: i + 1,
        predictedLoad: Math.random() * 100,
        predictedLatency: Math.random() * 150 + 50,
        optimalPlacement: Math.random() > 0.5,
        confidence: Math.random() * 30 + 70,
      }));
      setPredictions(nodes);
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate decision logs
    if (jobs.length > 0) {
      const latestJob = jobs[jobs.length - 1];
      const log = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        jobId: latestJob.id,
        scheduler: schedulerType,
        decision: schedulerType === 'drl' ? 'ML-optimized placement on Node 3' : 'First-fit placement on Node 1',
        reasoning: schedulerType === 'drl'
          ? 'Predicted lowest contention and balanced resource utilization'
          : 'First available node with sufficient resources',
        expectedLatency: schedulerType === 'drl' ? Math.random() * 50 + 50 : Math.random() * 100 + 100,
        confidence: schedulerType === 'drl' ? Math.random() * 20 + 80 : 100,
      };
      setDecisionLogs((prev) => [log, ...prev.slice(0, 49)]);
    }
  }, [jobs, schedulerType]);

  useEffect(() => {
    // ML Scheduler Metrics
    setMlMetrics({
      modelAccuracy: 94.7,
      trainingEpisodes: 50000,
      convergence: 98.2,
      explorationRate: 0.05,
      learningRate: 0.0001,
      rewardFunction: 'Latency + Utilization + Fairness',
      stateSpace: '128 dimensions',
      actionSpace: '8 nodes × 4 strategies',
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Scheduler Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-2">Scheduler Configuration</h2>
        <p className="text-slate-600 mb-6">Select and configure the scheduling algorithm</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Scheduler */}
          <button
            onClick={() => onSchedulerChange('baseline')}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              schedulerType === 'baseline'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Settings className="w-6 h-6 text-slate-700" />
              </div>
              {schedulerType === 'baseline' && (
                <div className="px-3 py-1 bg-blue-600 text-white rounded-full">
                  Active
                </div>
              )}
            </div>
            <h3 className="text-slate-900 mb-2">Baseline Scheduler</h3>
            <p className="text-slate-600 mb-4">Traditional first-fit scheduling algorithm</p>
            <ul className="space-y-2 text-slate-600">
              <li>• First-fit placement strategy</li>
              <li>• FIFO queue processing</li>
              <li>• No resource optimization</li>
              <li>• Deterministic behavior</li>
            </ul>
          </button>

          {/* DRL Scheduler */}
          <button
            onClick={() => onSchedulerChange('drl')}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              schedulerType === 'drl'
                ? 'border-purple-600 bg-purple-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-700" />
              </div>
              {schedulerType === 'drl' && (
                <div className="px-3 py-1 bg-purple-600 text-white rounded-full">
                  Active
                </div>
              )}
            </div>
            <h3 className="text-slate-900 mb-2">DRL-Based Scheduler</h3>
            <p className="text-slate-600 mb-4">Deep reinforcement learning optimized scheduling</p>
            <ul className="space-y-2 text-slate-600">
              <li>• ML-optimized job placement</li>
              <li>• Contention-aware decisions</li>
              <li>• Dynamic load balancing</li>
              <li>• Predictive resource allocation</li>
            </ul>
          </button>
        </div>
      </div>

      {/* ML Model Information (DRL Only) */}
      {schedulerType === 'drl' && mlMetrics && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-slate-900">DRL Model Information</h2>
              <p className="text-slate-600">Deep Q-Network (DQN) Scheduler</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-600 mb-1">Model Accuracy</div>
              <div className="text-slate-900">{mlMetrics.modelAccuracy}%</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${mlMetrics.modelAccuracy}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-600 mb-1">Training Episodes</div>
              <div className="text-slate-900">{mlMetrics.trainingEpisodes.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-600 mb-1">Convergence</div>
              <div className="text-slate-900">{mlMetrics.convergence}%</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${mlMetrics.convergence}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-600 mb-1">Exploration Rate</div>
              <div className="text-slate-900">{mlMetrics.explorationRate}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-700 mb-2">Reward Function</div>
              <div className="text-slate-600">{mlMetrics.rewardFunction}</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-700 mb-2">Learning Rate</div>
              <div className="text-slate-600">{mlMetrics.learningRate}</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-700 mb-2">State Space</div>
              <div className="text-slate-600">{mlMetrics.stateSpace}</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-slate-700 mb-2">Action Space</div>
              <div className="text-slate-600">{mlMetrics.actionSpace}</div>
            </div>
          </div>
        </div>
      )}

      {/* ML Predictions */}
      {schedulerType === 'drl' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-slate-900">ML Scheduler Predictions</h3>
              <p className="text-slate-600">Real-time predictions for optimal job placement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictions.map((pred) => (
              <div
                key={pred.nodeId}
                className={`p-4 rounded-lg border-2 ${
                  pred.optimalPlacement
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-900">Node {pred.nodeId}</span>
                  {pred.optimalPlacement && (
                    <div className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                      Optimal
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Predicted Load</span>
                      <span className="text-slate-900">{pred.predictedLoad.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${pred.predictedLoad}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-600">Est. Latency</div>
                    <div className="text-slate-900">{pred.predictedLatency.toFixed(0)}ms</div>
                  </div>

                  <div>
                    <div className="text-slate-600">Confidence</div>
                    <div className="text-green-700">{pred.confidence.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Logs */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart className="w-6 h-6 text-slate-700" />
          <div>
            <h3 className="text-slate-900">Scheduler Decision Logs</h3>
            <p className="text-slate-600">Historical scheduling decisions for offline analysis</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700">Timestamp</th>
                <th className="px-4 py-3 text-left text-slate-700">Job ID</th>
                <th className="px-4 py-3 text-left text-slate-700">Scheduler</th>
                <th className="px-4 py-3 text-left text-slate-700">Decision</th>
                <th className="px-4 py-3 text-left text-slate-700">Reasoning</th>
                <th className="px-4 py-3 text-left text-slate-700">Expected Latency</th>
                <th className="px-4 py-3 text-left text-slate-700">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {decisionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{log.timestamp}</td>
                  <td className="px-4 py-3 text-slate-700">{log.jobId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        log.scheduler === 'drl'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {log.scheduler.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.decision}</td>
                  <td className="px-4 py-3 text-slate-600">{log.reasoning}</td>
                  <td className="px-4 py-3 text-slate-700">{log.expectedLatency.toFixed(0)}ms</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">{log.confidence.toFixed(0)}%</span>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            log.confidence >= 80 ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${log.confidence}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {decisionLogs.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              No scheduling decisions logged yet
            </div>
          )}
        </div>
      </div>

      {/* Performance Comparison Chart */}
      {decisionLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Scheduler Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={decisionLogs.slice(0, 20).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="expectedLatency"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Expected Latency (ms)"
                dot={{ fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#10b981"
                strokeWidth={2}
                name="Confidence (%)"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
