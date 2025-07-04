import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";

const AuthLayout = () => {
  return (
    <div className="flex h-full">
      <SideBar />
      <main className="flex w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
