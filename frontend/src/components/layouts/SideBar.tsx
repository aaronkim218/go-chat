import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import LogoutButton from "../features/auth/LogoutButton";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleUser,
  House,
  MessageCircle,
  Search,
} from "lucide-react";
import { ModeToggle } from "../shared/ModeToggle";

const SideBar = () => {
  const { session } = useRequireAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>
        {isOpen ? <ChevronDown /> : <ChevronRight />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className=" flex flex-col items-center gap-2">
          <Button onClick={() => navigate("/home")}>
            <House />
          </Button>
          <Button onClick={() => navigate("/profile")}>
            <CircleUser />
          </Button>
          <Button onClick={() => navigate("/chat")}>
            <MessageCircle />
          </Button>
          <Button onClick={() => navigate("/search")}>
            <Search />
          </Button>
          <p>{session.user.email}</p>
          <LogoutButton />
          <ModeToggle />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SideBar;
