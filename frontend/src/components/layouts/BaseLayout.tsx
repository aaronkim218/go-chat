import { Outlet } from "react-router-dom";
import { useUserContext } from "@/contexts/User";
import { Toaster } from "sonner";

const BaseLayout = () => {
  const { firstLoad } = useUserContext();

  return firstLoad ? (
    <div>Loading...</div>
  ) : (
    <>
      <Outlet />
      <Toaster position="top-center" />
    </>
  );
};

export default BaseLayout;
