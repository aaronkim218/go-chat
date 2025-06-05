import { Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/auth";

const BaseLayout = () => {
  const { firstLoad } = useAuthContext();

  return firstLoad ? <div>Loading...</div> : <Outlet />;
};

export default BaseLayout;
