import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserMessagesByRoomId } from "@/api";
import { getJwt } from "@/utils/jwt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Message from "@/components/features/chat/Message";
import { CornerDownLeft, Send } from "lucide-react";
import { UserMessageSchema } from "@/schemas";
import { Room, UserMessage } from "@/types";
import camelcaseKeys from "camelcase-keys";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface MessagesProps {
  activeRoom: Room | null;
}

const MAX_RETRIES = 3;

const Messages = ({ activeRoom }: MessagesProps) => {
  const navigate = useNavigate();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeRoomRef = useRef<Room | null>(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;

    if (activeRoomRef.current) {
      initWebsocket(activeRoomRef.current.id);
      fetchMessages(activeRoomRef.current.id);
    }

    return () => {
      activeRoomRef.current = null;
      ws.current?.close();
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
      const data = camelcaseKeys(JSON.parse(event.data), { deep: true });
      const userMessage = UserMessageSchema.parse(data);
      setUserMessages((prev) => [...prev, userMessage]);
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

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(newMessage);
      setNewMessage("");
    }
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
      <div className=" flex h-[15vh]">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
