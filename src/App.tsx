import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { JobSubmission } from "./components/JobSubmission";
import { ClusterSimulation } from "./components/ClusterSimulation";
import { SchedulerControls } from "./components/SchedulerControls";
import { ExperimentManagement } from "./components/ExperimentManagement";
import { ValidationInsights } from "./components/ValidationInsights";
import {
  Activity,
  Database,
  PlayCircle,
  Settings,
  BarChart3,
  CheckCircle,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("simulation");
  const [jobs, setJobs] = useState<any[]>([]);
  const [schedulerType, setSchedulerType] = useState<"baseline" | "drl">(
    "baseline"
  );
  const [simulationState, setSimulationState] = useState<
    "stopped" | "running" | "paused"
  >("stopped");

  const tabs = [
    { id: "simulation", label: "Cluster Simulation", icon: PlayCircle },
    { id: "admin", label: "Admin Dashboard", icon: Activity },
    { id: "submission", label: "Job Submission", icon: Database },
    { id: "scheduler", label: "Scheduler Controls", icon: Settings },
    { id: "experiments", label: "Experiments", icon: BarChart3 },
    { id: "insights", label: "Validation & Insights", icon: CheckCircle },
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
                <div
                  className={`w-2 h-2 rounded-full ${
                    simulationState === "running"
                      ? "bg-green-500 animate-pulse"
                      : simulationState === "paused"
                      ? "bg-yellow-500"
                      : "bg-slate-400"
                  }`}
                />
                <span className="text-slate-700 capitalize">
                  {simulationState}
                </span>
              </div>
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                Scheduler:{" "}
                <span className="font-medium uppercase">{schedulerType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 px-6 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === "simulation" && (
          <ClusterSimulation
            jobs={jobs}
            schedulerType={schedulerType}
            simulationState={simulationState}
            onSimulationStateChange={setSimulationState}
          />
        )}
        {activeTab === "admin" && (
          <AdminDashboard
            jobs={jobs}
            schedulerType={schedulerType}
            simulationState={simulationState}
          />
        )}
        {activeTab === "submission" && (
          <JobSubmission
            onJobSubmit={(job) => setJobs([...jobs, job])}
            simulationState={simulationState}
          />
        )}
        {activeTab === "scheduler" && (
          <SchedulerControls
            schedulerType={schedulerType}
            onSchedulerChange={setSchedulerType}
            jobs={jobs}
          />
        )}
        {activeTab === "experiments" && (
          <ExperimentManagement schedulerType={schedulerType} />
        )}
        {activeTab === "insights" && (
          <ValidationInsights jobs={jobs} schedulerType={schedulerType} />
        )}
      </main>
    </div>
  );
}
