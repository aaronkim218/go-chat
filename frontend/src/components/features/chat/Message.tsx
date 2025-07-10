import { Ellipsis, Trash } from "lucide-react";
import { deleteMessageById } from "@/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTimeAgo } from "@/utils/time";
import { UserMessage } from "@/types";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { useTick } from "@/hooks/useTick";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface MessageProps {
  userMessage: UserMessage;
  setUserMessages: React.Dispatch<React.SetStateAction<UserMessage[]>>;
}

const Message = ({ userMessage, setUserMessages }: MessageProps) => {
  const { session } = useRequireAuth();
  useTick();

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageById(messageId);
      setUserMessages((prev) =>
        prev.filter((message) => message.id !== messageId),
      );
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  return (
    <div
      key={userMessage.id}
      className={`flex ${userMessage.author === session.user.id ? "justify-end" : "justify-start"}`}
    >
      <div className=" group flex min-w-1/3 max-w-3/4 gap-4">
        {userMessage.author !== session.user.id && (
          <CustomAvatar
            firstName={userMessage.firstName}
            lastName={userMessage.lastName}
          />
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
          <p
            className={`${userMessage.author === session.user.id ? "text-secondary-foreground" : "text-primary-foreground"} w-full break-words`}
          >
            {userMessage.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Message;
