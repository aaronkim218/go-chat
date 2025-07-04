import { UserMessage } from "@/types";
import { Button } from "../../ui/button";
import { Trash, User } from "lucide-react";
import { deleteMessageById } from "@/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMessageContainerProps {
  userMessage: UserMessage;
  setUserMessages: React.Dispatch<React.SetStateAction<UserMessage[]>>;
}

const UserMessageContainer = ({
  userMessage,
  setUserMessages,
}: UserMessageContainerProps) => {
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
    <div key={userMessage.id}>
      <Avatar>
        <AvatarFallback>{getAvatarFallback() || <User />}</AvatarFallback>
      </Avatar>
      {userMessage.content}
      {userMessage.author === session.user.id && (
        <Button onClick={() => handleDeleteMessage(userMessage.id)}>
          <Trash />
        </Button>
      )}
    </div>
  );
};

export default UserMessageContainer;
