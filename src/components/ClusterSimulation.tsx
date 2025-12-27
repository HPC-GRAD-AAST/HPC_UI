import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Cpu, MemoryStick, Server, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

export function ClusterSimulation({ jobs, schedulerType, simulationState, onSimulationStateChange }: any) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // Initialize cluster
  useEffect(() => {
    const initialNodes = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      cpuTotal: 16,
      cpuUsed: 0,
      ramTotal: 32,
      ramUsed: 0,
      jobs: [],
      throttled: false,
      contention: 0,
    }));
    setNodes(initialNodes);
  }, []);

  // Simulation tick
  useEffect(() => {
    if (simulationState !== 'running') return;

    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => {
          // Simulate job completion and resource release
          const releaseChance = Math.random();
          if (releaseChance > 0.7 && node.cpuUsed > 0) {
            const released = Math.min(4, node.cpuUsed);
            const ramReleased = Math.min(8, node.ramUsed);
            
            setLogs((prev) => [{
              id: Date.now() + Math.random(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'completion',
              message: `Node ${node.id}: Job completed, released ${released} CPU, ${ramReleased}GB RAM`,
              nodeId: node.id,
              cpuReleased: released,
              ramReleased: ramReleased,
            }, ...prev.slice(0, 99)]);

            return {
              ...node,
              cpuUsed: Math.max(0, node.cpuUsed - released),
              ramUsed: Math.max(0, node.ramUsed - ramReleased),
              jobs: node.jobs.slice(1),
              throttled: (node.cpuUsed - released) / node.cpuTotal > 0.85,
              contention: Math.max(0, node.contention - 0.2),
            };
          }

          // Calculate throttling and contention
          const cpuUtilization = node.cpuUsed / node.cpuTotal;
          const ramUtilization = node.ramUsed / node.ramTotal;
          
          return {
            ...node,
            throttled: cpuUtilization > 0.85 || ramUtilization > 0.9,
            contention: Math.min(1, cpuUtilization * ramUtilization * 1.2),
          };
        });

        // Update performance metrics
        const avgCpuUtil = newNodes.reduce((sum, n) => sum + n.cpuUsed / n.cpuTotal, 0) / newNodes.length;
        const avgRamUtil = newNodes.reduce((sum, n) => sum + n.ramUsed / n.ramTotal, 0) / newNodes.length;
        const throttledNodes = newNodes.filter((n) => n.throttled).length;

        setPerformanceData((prev) => [
          ...prev.slice(-29),
          {
            time: new Date().toLocaleTimeString(),
            cpu: (avgCpuUtil * 100).toFixed(1),
            ram: (avgRamUtil * 100).toFixed(1),
            throttled: throttledNodes,
            contention: (newNodes.reduce((sum, n) => sum + n.contention, 0) / newNodes.length * 100).toFixed(1),
          },
        ]);

        return newNodes;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationState]);

  // Process queue
  useEffect(() => {
    if (simulationState !== 'running' || queue.length === 0) return;

    const processQueue = () => {
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;

        const job = prevQueue[0];
        
        // Find best node based on scheduler type
        let bestNode: number | null = null;
        
        setNodes((prevNodes) => {
          const availableNodes = prevNodes.filter(
            (n) => n.cpuTotal - n.cpuUsed >= job.cpu && n.ramTotal - n.ramUsed >= job.ram
          );

          if (availableNodes.length === 0) {
            setLogs((prev) => [{
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'warning',
              message: `Job ${job.id}: Insufficient resources, waiting in queue`,
              jobId: job.id,
              cpuRequired: job.cpu,
              ramRequired: job.ram,
            }, ...prev.slice(0, 99)]);
            return prevNodes;
          }

          // Scheduler decision logic
          if (schedulerType === 'drl') {
            // DRL: minimize contention and balance load
            bestNode = availableNodes.reduce((best, node) =>
              node.contention < best.contention ? node : best
            ).id;
          } else {
            // Baseline: first-fit
            bestNode = availableNodes[0].id;
          }

          const newNodes = prevNodes.map((node) => {
            if (node.id === bestNode) {
              setLogs((prev) => [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                type: 'placement',
                message: `Job ${job.id} placed on Node ${node.id} (${schedulerType.toUpperCase()})`,
                jobId: job.id,
                nodeId: node.id,
                cpuAllocated: job.cpu,
                ramAllocated: job.ram,
                scheduler: schedulerType,
                prediction: schedulerType === 'drl' ? `Low contention (${(node.contention * 100).toFixed(0)}%)` : 'N/A',
              }, ...prev.slice(0, 99)]);

              return {
                ...node,
                cpuUsed: node.cpuUsed + job.cpu,
                ramUsed: node.ramUsed + job.ram,
                jobs: [...node.jobs, job.id],
              };
            }
            return node;
          });

          return newNodes;
        });

        return bestNode !== null ? prevQueue.slice(1) : prevQueue;
      });
    };

    const queueInterval = setInterval(processQueue, 3000);
    return () => clearInterval(queueInterval);
  }, [simulationState, queue, schedulerType]);

  // Add jobs to queue
  useEffect(() => {
    if (jobs.length > 0 && simulationState === 'running') {
      const latestJob = jobs[jobs.length - 1];
      if (!queue.find((j) => j.id === latestJob.id)) {
        setQueue((prev) => [...prev, latestJob]);
      }
    }
  }, [jobs, simulationState]);

  const handleReset = () => {
    setNodes((prev) => prev.map((n) => ({
      ...n,
      cpuUsed: 0,
      ramUsed: 0,
      jobs: [],
      throttled: false,
      contention: 0,
    })));
    setQueue([]);
    setLogs([]);
    setPerformanceData([]);
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">Simulation Controls</h2>
            <p className="text-slate-600 mt-1">Manage cluster simulation execution</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSimulationStateChange(simulationState === 'running' ? 'paused' : 'running')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                simulationState === 'running'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {simulationState === 'running' ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cluster Visualization */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Cluster Nodes (Homogeneous Configuration)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {nodes.map((node) => {
              const cpuPercent = (node.cpuUsed / node.cpuTotal) * 100;
              const ramPercent = (node.ramUsed / node.ramTotal) * 100;

              return (
                <div
                  key={node.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    node.throttled
                      ? 'border-red-500 bg-red-50'
                      : cpuPercent > 70
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-700" />
                      <span className="text-slate-900">Node {node.id}</span>
                    </div>
                    {node.throttled && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  </div>

                  {/* CPU */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-700">CPU</span>
                      </div>
                      <span className="text-slate-600">{node.cpuUsed}/{node.cpuTotal}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          cpuPercent > 85 ? 'bg-red-600' : cpuPercent > 70 ? 'bg-yellow-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <MemoryStick className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-700">RAM</span>
                      </div>
                      <span className="text-slate-600">{node.ramUsed}/{node.ramTotal}GB</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          ramPercent > 90 ? 'bg-red-600' : ramPercent > 70 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${ramPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Contention */}
                  {node.contention > 0 && (
                    <div className="text-xs text-slate-600 mt-2">
                      Contention: {(node.contention * 100).toFixed(0)}%
                    </div>
                  )}

                  {/* Active Jobs */}
                  <div className="text-xs text-slate-600 mt-2">
                    Jobs: {node.jobs.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Job Queue */}
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
                  <span className="text-blue-900">#{idx + 1} - {job.id}</span>
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    Queued
                  </span>
                </div>
                <div className="text-sm text-blue-800">
                  CPU: {job.cpu} cores | RAM: {job.ram}GB
                </div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                Queue is empty
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Resource Utilization Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="CPU %" />
              <Area type="monotone" dataKey="ram" stackId="2" stroke="#10b981" fill="#10b981" name="RAM %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Non-Linear Performance Effects</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="throttled" fill="#ef4444" name="Throttled Nodes" />
              <Bar dataKey="contention" fill="#f59e0b" name="Memory Contention %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Execution Logs */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Execution Logs & Placement Decisions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: 'timestamp', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-slate-700">Type</th>
                <th className="px-4 py-3 text-left text-slate-700">Message</th>
                <th className="px-4 py-3 text-left text-slate-700">Resources</th>
                <th className="px-4 py-3 text-left text-slate-700">Scheduler Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        log.type === 'placement'
                          ? 'bg-green-100 text-green-800'
                          : log.type === 'completion'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
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
                        <div className="text-slate-900">{log.scheduler.toUpperCase()}</div>
                        {log.prediction && <div className="text-xs text-slate-600">{log.prediction}</div>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              No logs yet. Start the simulation to see execution logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
