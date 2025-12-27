import { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Clock, XCircle, Database } from 'lucide-react';

export function JobSubmission({ onJobSubmit, simulationState }: any) {
  const [formData, setFormData] = useState({
    jobName: '',
    cpu: 4,
    ram: 8,
    duration: 60,
    priority: 'medium',
  });

  const [submittedJobs, setSubmittedJobs] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.jobName.trim()) {
      setError('Job name is required');
      return;
    }

    if (formData.cpu < 1 || formData.cpu > 16) {
      setError('CPU cores must be between 1 and 16');
      return;
    }

    if (formData.ram < 1 || formData.ram > 32) {
      setError('RAM must be between 1GB and 32GB');
      return;
    }

    if (simulationState !== 'running') {
      setError('Simulation must be running to submit jobs');
      return;
    }

    // Create job
    const job = {
      id: `job-${Date.now()}`,
      name: formData.jobName,
      cpu: formData.cpu,
      ram: formData.ram,
      duration: formData.duration,
      priority: formData.priority,
      status: 'queued',
      submittedAt: new Date().toISOString(),
    };

    onJobSubmit(job);
    setSubmittedJobs([job, ...submittedJobs]);

    // Update job status over time (simulation)
    setTimeout(() => {
      setSubmittedJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'running' } : j))
      );
    }, 3000);

    setTimeout(() => {
      setSubmittedJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'completed' } : j))
      );
    }, 8000);

    // Reset form
    setFormData({
      jobName: '',
      cpu: 4,
      ram: 8,
      duration: 60,
      priority: 'medium',
    });
  };

  const statusConfig = {
    queued: { icon: Clock, color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    running: { icon: CheckCircle, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    completed: { icon: CheckCircle, color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    failed: { icon: XCircle, color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Submission Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-2">Submit New Job</h2>
        <p className="text-slate-600 mb-6">Configure and submit jobs to the cluster scheduler</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-900">Submission Error</div>
              <div className="text-red-700 mt-1">{error}</div>
            </div>
          </div>
        )}

        {simulationState !== 'running' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-yellow-900">Simulation Not Running</div>
              <div className="text-yellow-700 mt-1">Start the simulation to submit jobs</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Name */}
          <div>
            <label className="block text-slate-700 mb-2">
              Job Name
            </label>
            <input
              type="text"
              value={formData.jobName}
              onChange={(e) => setFormData({ ...formData, jobName: e.target.value })}
              placeholder="e.g., data-processing-task"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CPU Cores */}
          <div>
            <label className="block text-slate-700 mb-2">
              CPU Cores Required
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="16"
                value={formData.cpu}
                onChange={(e) => setFormData({ ...formData, cpu: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="px-4 py-2 bg-slate-100 rounded-lg min-w-[80px] text-center text-slate-900">
                {formData.cpu} cores
              </div>
            </div>
            <p className="text-slate-600 mt-2">Max: 16 cores per node</p>
          </div>

          {/* RAM */}
          <div>
            <label className="block text-slate-700 mb-2">
              RAM Required (GB)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="32"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="px-4 py-2 bg-slate-100 rounded-lg min-w-[80px] text-center text-slate-900">
                {formData.ram}GB
              </div>
            </div>
            <p className="text-slate-600 mt-2">Max: 32GB per node</p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-slate-700 mb-2">
              Estimated Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="1"
              max="3600"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-slate-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={simulationState !== 'running'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            <span>Submit Job</span>
          </button>
        </form>

        {/* Resource Summary */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="text-slate-700 mb-2">Resource Summary</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-slate-600">CPU</div>
              <div className="text-slate-900">{formData.cpu} / 16 cores</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(formData.cpu / 16) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-slate-600">RAM</div>
              <div className="text-slate-900">{formData.ram} / 32 GB</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(formData.ram / 32) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Status Tracking */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 mb-2">Job Status Tracking</h2>
        <p className="text-slate-600 mb-6">Monitor submitted jobs and their execution status</p>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {submittedJobs.map((job) => {
            const config = statusConfig[job.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;

            return (
              <div
                key={job.id}
                className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-slate-900 mb-1">{job.name}</div>
                    <div className="text-slate-600">{job.id}</div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${config.bg} ${config.text}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="capitalize">{job.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-slate-600">CPU</div>
                    <div className={config.text}>{job.cpu} cores</div>
                  </div>
                  <div>
                    <div className="text-slate-600">RAM</div>
                    <div className={config.text}>{job.ram}GB</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Duration</div>
                    <div className={config.text}>{job.duration}s</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Priority</div>
                    <div className={`${config.text} capitalize`}>{job.priority}</div>
                  </div>
                </div>

                <div className="text-slate-600">
                  Submitted: {new Date(job.submittedAt).toLocaleString()}
                </div>

                {/* Progress indicator for running jobs */}
                {job.status === 'running' && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {submittedJobs.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No jobs submitted yet</p>
              <p className="text-sm mt-1">Submit your first job using the form</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}