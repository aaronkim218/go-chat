import { Ellipsis, Trash, User } from "lucide-react";
import { deleteMessageById } from "@/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTimeAgo } from "@/utils/time";
import { UserMessage } from "@/types";

interface MessageProps {
  userMessage: UserMessage;
  setUserMessages: React.Dispatch<React.SetStateAction<UserMessage[]>>;
}

const Message = ({ userMessage, setUserMessages }: MessageProps) => {
  const { session } = useRequireAuth();

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageById(messageId);
      setUserMessages((prev) =>
        prev.filter((message) => message.id !== messageId),
      );
    } catch (error) {
      console.error("error deleting message:", error);
    }
  };

  const getAvatarFallback = (): string | null => {
    if (userMessage.firstName || userMessage.lastName) {
      return `${userMessage.firstName?.charAt(0).toUpperCase() || ""}${userMessage.lastName?.charAt(0).toUpperCase() || ""}`;
    }

    return null;
  };

  return (
    <div
      key={userMessage.id}
      className={`flex ${userMessage.author === session.user.id ? "justify-end" : "justify-start"}`}
    >
      <div className=" group flex min-w-1/3 max-w-3/4 gap-4">
        {userMessage.author !== session.user.id && (
          <Avatar>
            <AvatarFallback>{getAvatarFallback() || <User />}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={`flex flex-col gap-1 px-4 pb-4 pt-2 w-full ${userMessage.author === session.user.id ? "bg-secondary" : "bg-primary"} rounded-lg`}
        >
          <div className=" flex justify-between items-center ">
            <p className=" text-muted-foreground text-sm">
              {userMessage.username} {"\u2022"}{" "}
              {getTimeAgo(userMessage.createdAt)}
            </p>
            {userMessage.author === session.user.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Ellipsis className="opacity-0 group-hover:opacity-100" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleDeleteMessage(userMessage.id)}
                  >
                    <Trash />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {userMessage.content}
        </div>
      </div>
    </div>
  );
};

export default Message;
