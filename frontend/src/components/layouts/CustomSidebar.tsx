import { useNavigate } from "react-router-dom";
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
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import useLogout from "@/hooks/useLogout";

const CustomSidebar = () => {
  const { profile } = useRequireAuth();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const { handleLogout } = useLogout();

  const items = [
    {
      title: "Home",
      onClick: () => navigate("/home"),
      icon: <House />,
    },
    {
      title: "Chat",
      onClick: () => navigate("/chat"),
      icon: <MessageCircle />,
    },
    {
      title: "Search",
      onClick: () => navigate("/search"),
      icon: <Users />,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeIndex === index}
                    className="flex items-center"
                    onClick={() => {
                      item.onClick();
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
                <SidebarMenuButton className=" pl-0">
                  <CustomAvatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                  />
                  {profile.username}
                </SidebarMenuButton>
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
