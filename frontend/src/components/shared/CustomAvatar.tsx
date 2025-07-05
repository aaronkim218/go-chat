import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface CustomAvatarProps {
  firstName: string;
  lastName: string;
}

const CustomAvatar = ({ firstName, lastName }: CustomAvatarProps) => {
  const getAvatarFallback = (): string | null => {
    if (firstName || lastName) {
      return `${firstName?.charAt(0).toUpperCase() || ""}${lastName?.charAt(0).toUpperCase() || ""}`;
    }

    return null;
  };

  return (
    <Avatar>
      <AvatarFallback>{getAvatarFallback() || <User />}</AvatarFallback>
    </Avatar>
  );
};

export default CustomAvatar;
