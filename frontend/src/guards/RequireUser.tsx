import { Navigate, Outlet } from "react-router-dom";
import { useUserContext } from "../contexts/user";

const RequireUser = () => {
  const { session, profile, firstLoad } = useUserContext();

  if (firstLoad) {
    return <div>Loading...</div>;
  }

  return session && profile ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireUser;
