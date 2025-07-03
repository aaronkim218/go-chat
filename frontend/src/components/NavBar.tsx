import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import LogoutButton from "./LogoutButton";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleUser,
  House,
  MessageCircle,
  Search,
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const NavBar = () => {
  const { session } = useRequireAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>
        {isOpen ? <ChevronDown /> : <ChevronRight />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <nav className=" flex flex-col items-center gap-2">
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
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NavBar;
