import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AppChrome from "./AppChrome";

export default function ProtectedRoute() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <AppChrome />;
}
