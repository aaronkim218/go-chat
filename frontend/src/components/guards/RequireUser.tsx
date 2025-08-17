import { Navigate, Outlet } from "react-router-dom";
import { useUserContext } from "@/contexts/User";
import { WebSocketProvider } from "@/contexts/WebSocket";

const RequireUser = () => {
  const { session, profile, firstLoad } = useUserContext();

  if (firstLoad) {
    return <div>Loading...</div>;
  }

  if (session && profile) {
    return (
      <WebSocketProvider profile={profile}>
        <Outlet />
      </WebSocketProvider>
    );
  }

  return <Navigate to="/login" replace />;
};

export default RequireUser;
