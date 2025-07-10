import { useLocation, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState } from "react";
import { House, LogOut, MessageCircle, User, Users } from "lucide-react";
import { ModeToggle } from "@/components/shared/ModeToggle";
import CustomAvatar from "@/components/shared/CustomAvatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import useLogout from "@/hooks/useLogout";
import { Button } from "../ui/button";

const ITEMS = [
  {
    title: "Home",
    icon: <House />,
    path: "/home",
  },
  {
    title: "Chat",
    icon: <MessageCircle />,
    path: "/chat",
  },
  {
    title: "Search",
    icon: <Users />,
    path: "/search",
  },
];

const CustomSidebar = () => {
  const { profile } = useRequireAuth();
  const navigate = useNavigate();
  const { handleLogout } = useLogout();
  const { open } = useSidebar();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(() =>
    ITEMS.findIndex((item) => item.path === location.pathname),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeIndex === index}
                    className="flex items-center"
                    onClick={() => {
                      navigate(item.path);
                      setActiveIndex(index);
                    }}
                  >
                    {item.icon}
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <ModeToggle variant={"ghost"} />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} className="p-0">
                  <CustomAvatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                  />
                  {open && profile.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLogout()}>
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CustomSidebar;
