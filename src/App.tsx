import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ClusterBuilder } from "@/components/ClusterBuilder";
import { ClusterSimulation } from "@/components/ClusterSimulation";
import { ExperimentComparison } from "@/components/ExperimentComparison";
import { ExperimentManagement } from "@/components/ExperimentManagement";
import { JobSubmission } from "@/components/JobSubmission";
import { SchedulerControls } from "@/components/SchedulerControls";
import { RunsAnalytics } from "@/components/RunsAnalytics";
import { ValidationInsights } from "@/components/ValidationInsights";
import { WorkloadTraceManager } from "@/components/WorkloadTraceManager";
import { WorkloadBuilder } from "@/components/WorkloadBuilder";
import { BenchmarkLab } from "@/components/BenchmarkLab";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import HelpPage from "@/pages/HelpPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/simulation" replace />} />
            <Route path="/simulation" element={<ClusterSimulation />} />
            <Route path="/clusters" element={<ClusterBuilder />} />
            <Route path="/jobs" element={<JobSubmission />} />
            <Route path="/workflows" element={<WorkloadBuilder />} />
            <Route path="/benchmark" element={<BenchmarkLab />} />
            <Route path="/traces" element={<WorkloadTraceManager />} />
            <Route path="/experiments" element={<ExperimentManagement />} />
            <Route path="/compare" element={<ExperimentComparison />} />
            <Route path="/policies" element={<SchedulerControls />} />
            <Route path="/runs" element={<RunsAnalytics />} />
            <Route path="/insights" element={<ValidationInsights />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
