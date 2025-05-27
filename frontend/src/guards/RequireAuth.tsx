import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/auth";

const RequireAuth = () => {
  const { session, profile, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  return session && profile ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
