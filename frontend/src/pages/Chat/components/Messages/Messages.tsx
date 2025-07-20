import { useEffect, useRef, useState } from "react";
import { getUserMessagesByRoomId } from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Message from "@/components/features/chat/Message";
import { CornerDownLeft, Send } from "lucide-react";
import { Room, UserMessage, Profile } from "@/types";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";
import CustomAvatar from "@/components/shared/CustomAvatar";

interface MessagesProps {
  activeRoom: Room | null;
  userMessages: UserMessage[];
  setUserMessages: React.Dispatch<React.SetStateAction<UserMessage[]>>;
  sendMessage: (content: string) => void;
  sendTypingStatus: () => void;
  typingProfilesSet: Set<string>;
  profilesHashMap: Map<string, Profile>;
}

const Messages = ({
  activeRoom,
  userMessages,
  setUserMessages,
  sendMessage,
  sendTypingStatus,
  typingProfilesSet,
  profilesHashMap,
}: MessagesProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const typingProfiles = Array.from(typingProfilesSet);

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
    <div className=" flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        className=" flex flex-col gap-4 overflow-y-auto flex-1 px-4 pt-4"
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
      <div className="h-15 flex items-center px-4">
        {typingProfilesSet.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {typingProfiles.map((profileId) => {
                const profile = profilesHashMap.get(profileId);
                return profile ? (
                  <CustomAvatar
                    key={profileId}
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                  />
                ) : null;
              })}
            </div>
            <span>typing...</span>
          </div>
        )}
      </div>
      <div className=" flex">
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
