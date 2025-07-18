import { useEffect, useRef, useState } from "react";
import { getUserMessagesByRoomId } from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Message from "@/components/features/chat/Message";
import { CornerDownLeft, Send } from "lucide-react";
import { Room, UserMessage } from "@/types";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface MessagesProps {
  activeRoom: Room | null;
  userMessages: UserMessage[];
  setUserMessages: React.Dispatch<React.SetStateAction<UserMessage[]>>;
  sendMessage: (content: string) => void;
  sendTypingStatus: () => void;
  typingProfiles: Set<string>;
}

const Messages = ({
  activeRoom,
  userMessages,
  setUserMessages,
  sendMessage,
  sendTypingStatus,
  typingProfiles,
}: MessagesProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
    }
  }, [activeRoom]);

  const fetchMessages = async (roomId: string) => {
    try {
      const msgs = await getUserMessagesByRoomId(roomId);
      setUserMessages(msgs);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userMessages]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const bottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      setAutoScroll(bottom);
    };

    el.addEventListener("scroll", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [activeRoom]);

  const handleSendMessage = (newMessage: string) => {
    sendMessage(newMessage);
    setNewMessage("");
  };

  return activeRoom ? (
    <div className="">
      <div
        ref={scrollContainerRef}
        className=" flex flex-col gap-4 overflow-y-auto h-[85vh] px-4 pt-4"
      >
        {userMessages.map((userMessage) => (
          <Message
            key={userMessage.id}
            userMessage={userMessage}
            setUserMessages={setUserMessages}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {typingProfiles.size > 0 && (
        <div className="text-sm text-gray-500">
          {Array.from(typingProfiles).map((profileId) => (
            <span key={profileId} className="font-semibold">
              {profileId}
            </span>
          ))}{" "}
          is typing...
        </div>
      )}
      <div className=" flex h-[15vh]">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            sendTypingStatus();
          }}
        />
        <Button onClick={() => handleSendMessage(newMessage)}>
          <Send />
        </Button>
      </div>
    </div>
  ) : (
    <div className=" flex flex-col justify-center items-center h-full text-2xl">
      You need to select a room first
      <CornerDownLeft className=" mt-4 scale-200" />
    </div>
  );
};

export default Messages;
