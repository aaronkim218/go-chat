import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import LogoutButton from "@/components/features/auth/LogoutButton";
import { useState } from "react";
import { House, MessageCircle, Users } from "lucide-react";
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

const CustomSidebar = () => {
  const { profile } = useRequireAuth();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

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
                  <SidebarMenuButton asChild isActive={activeIndex === index}>
                    <div
                      className="flex items-center"
                      onClick={() => {
                        item.onClick();
                        setActiveIndex(index);
                      }}
                    >
                      {item.icon}
                      {item.title}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <ModeToggle />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className=" flex items-center gap-4">
                    <CustomAvatar
                      firstName={profile.firstName}
                      lastName={profile.lastName}
                      className=" w-4 h-4 scale-200"
                    />
                    {profile.username}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
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
