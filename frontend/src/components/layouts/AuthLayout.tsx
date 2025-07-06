import { Outlet } from "react-router-dom";
import CustomSidebar from "@/components/layouts/CustomSidebar";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";

const AuthLayout = () => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "10rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-full w-full">
        <CustomSidebar />
        <main className="flex w-full">
          <SidebarTrigger />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AuthLayout;
