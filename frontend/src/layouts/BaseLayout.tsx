import { Outlet } from "react-router-dom";
import { useUserContext } from "../contexts/user";

const BaseLayout = () => {
  const { firstLoad } = useUserContext();

  return firstLoad ? <div>Loading...</div> : <Outlet />;
};

export default BaseLayout;
