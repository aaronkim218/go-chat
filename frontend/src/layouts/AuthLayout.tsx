import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

const AuthLayout = () => {
  return (
    <div className="flex h-full">
      <NavBar />
      <main className="flex w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
