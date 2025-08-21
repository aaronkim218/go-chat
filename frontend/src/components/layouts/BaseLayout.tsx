import { Outlet } from "react-router-dom";
import { useUserContext } from "@/contexts/User";
import { Toaster } from "sonner";
import { LoaderCircle } from "lucide-react";

const BaseLayout = () => {
  const { firstLoad } = useUserContext();

  return firstLoad ? (
    <div className=" flex flex-col justify-center items-center h-full gap-3">
      <LoaderCircle size={"8rem"} className="animate-spin" />
      <p className=" text-3xl">Loading...</p>
      <p>(this could take a few minutes due to cold server start)</p>
    </div>
  ) : (
    <>
      <Outlet />
      <Toaster position="top-center" />
    </>
  );
};

export default BaseLayout;
