import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserMessagesByRoomId } from "@/api";
import { getJwt } from "@/utils/jwt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Message from "@/components/features/chat/Message";
import { CornerDownLeft, Send } from "lucide-react";
import { IncomingWSMessageSchema } from "@/schemas";
import {
  IncomingPresence,
  IncomingTypingStatus,
  OutgoingTypingStatus,
  OutgoingUserMessage,
  OutgoingWSMessage,
  PresenceAction,
  Room,
  UserMessage,
  WSMessageType,
} from "@/types";
import camelcaseKeys from "camelcase-keys";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import snakecasekeys from "snakecase-keys";

interface MessagesProps {
  activeRoom: Room | null;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setActiveProfiles: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const MAX_RETRIES = 3;

const Messages = ({
  activeRoom,
  setRooms,
  setActiveProfiles,
}: MessagesProps) => {
  const navigate = useNavigate();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeRoomRef = useRef<Room | null>(activeRoom);
  const [typingProfiles, setTypingProfiles] = useState<Set<string>>(new Set());
  const { profile } = useRequireAuth();
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setTypingProfiles(new Set());
    activeRoomRef.current = activeRoom;
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();

    if (activeRoomRef.current) {
      initWebsocket(activeRoomRef.current.id);
      fetchMessages(activeRoomRef.current.id);
    }

    return () => {
      activeRoomRef.current = null;
      ws.current?.close();
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
    };
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

  const initWebsocket = (roomId: string) => {
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current = null;
    }

    ws.current = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}/rooms/${roomId}`,
    );

    ws.current.onopen = () => {
      const jwt = getJwt();
      if (!jwt) {
        navigate("/");
        return;
      }
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(jwt);
      }
    };

    ws.current.onmessage = (event) => {
      const data = camelcaseKeys(JSON.parse(event.data), {
        deep: true,
      });
      try {
        const incomingWsMessage = IncomingWSMessageSchema.parse(data);
        switch (incomingWsMessage.type) {
          case WSMessageType.USER_MESSAGE: {
            handleIncomingUserMessage(incomingWsMessage.payload);
            break;
          }
          case WSMessageType.PRESENCE: {
            handleIncomingPresence(incomingWsMessage.payload);
            break;
          }
          case WSMessageType.TYPING_STATUS: {
            handleIncomingTypingStatus(incomingWsMessage.payload);
            break;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Failed to parse incoming message: ${error.message}`);
        } else {
          toast.error(UNKNOWN_ERROR);
        }
      }
    };

    ws.current.onclose = () => {
      if (activeRoomRef.current && retries.current < MAX_RETRIES) {
        retries.current += 1;
        setTimeout(() => {
          if (activeRoomRef.current) {
            initWebsocket(activeRoomRef.current.id);
          }
        }, 1000 * retries.current);
      }
    };
  };

  const handleIncomingUserMessage = (userMessage: UserMessage) => {
    setUserMessages((prev) => [...prev, userMessage]);
    setRooms((prev) => {
      const currentRoomId = activeRoomRef.current?.id;
      if (!currentRoomId) return prev;

      if (prev.length > 0 && prev[0].id === currentRoomId) {
        return prev;
      }

      const currentRoomIndex = prev.findIndex(
        (room) => room.id === currentRoomId,
      );
      if (currentRoomIndex === -1) return prev;

      const currentRoom = prev[currentRoomIndex];
      const otherRooms = prev.filter((_, index) => index !== currentRoomIndex);

      return [currentRoom, ...otherRooms];
    });
    setTypingProfiles((prev) => {
      const newTypingProfiles = new Set(prev);
      newTypingProfiles.delete(userMessage.author);
      return newTypingProfiles;
    });

    const existingTimer = typingTimersRef.current.get(userMessage.author);
    if (existingTimer) {
      clearTimeout(existingTimer);
      typingTimersRef.current.delete(userMessage.author);
    }
  };

  const handleIncomingPresence = (presence: IncomingPresence) => {
    setActiveProfiles((prev) => {
      const newActiveProfiles = new Set(prev);
      switch (presence.action) {
        case PresenceAction.JOIN: {
          presence.profiles?.forEach((profile) => {
            newActiveProfiles.add(profile.userId);
          });
          break;
        }
        case PresenceAction.LEAVE: {
          presence.profiles?.forEach((profile) => {
            newActiveProfiles.delete(profile.userId);
          });
          break;
        }
      }
      return newActiveProfiles;
    });
  };

  const handleIncomingTypingStatus = (typingStatus: IncomingTypingStatus) => {
    setTypingProfiles((prev) => {
      const newTypingProfiles = new Set(prev);
      typingStatus.profiles?.forEach((profile) =>
        newTypingProfiles.add(profile.userId),
      );
      return newTypingProfiles;
    });

    typingStatus.profiles?.forEach((profile) => {
      const existingTimer = typingTimersRef.current.get(profile.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        setTypingProfiles((prev) => {
          const newTypingProfiles = new Set(prev);
          newTypingProfiles.delete(profile.userId);
          return newTypingProfiles;
        });

        typingTimersRef.current.delete(profile.userId);
      }, 5000);

      typingTimersRef.current.set(profile.userId, timer);
    });
  };

  const handleSendTypingStatus = () => {
    const outgoingTypingStatus: OutgoingTypingStatus = {
      profile: profile,
    };

    const wsMessage: OutgoingWSMessage<OutgoingTypingStatus> = {
      type: WSMessageType.TYPING_STATUS,
      payload: outgoingTypingStatus,
    };

    handleWriteData(wsMessage);
  };

  const handleWriteData: <T>(outgoingMsg: OutgoingWSMessage<T>) => void = (
    outgoingMsg,
  ) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const data = snakecasekeys(
        { ...outgoingMsg },
        {
          deep: true,
        },
      );
      ws.current.send(JSON.stringify(data));
    } else {
      toast.error("WebSocket is not open");
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
    if (!newMessage) {
      toast.warning("cannot send an empty message");
      return;
    }

    const outgoingUserMessage: OutgoingUserMessage = {
      content: newMessage,
    };

    const wsMessage: OutgoingWSMessage<OutgoingUserMessage> = {
      type: WSMessageType.USER_MESSAGE,
      payload: outgoingUserMessage,
    };

    handleWriteData(wsMessage);
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
            handleSendTypingStatus();
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
