import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredToken } from "@/lib/auth";

export function RequireAuth() {
  const location = useLocation();
  if (!getStoredToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
