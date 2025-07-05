import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserMessagesByRoomId } from "@/api";
import { getJwt } from "@/utils/jwt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Message from "@/components/features/chat/Message";
import { Send } from "lucide-react";
import { UserMessageSchema } from "@/schemas";
import { UserMessage } from "@/types";
import camelcaseKeys from "camelcase-keys";

interface MessagesProps {
  roomId: string;
}

const Messages = ({ roomId }: MessagesProps) => {
  const navigate = useNavigate();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  // const [retries, setRetries] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}/rooms/${roomId}`,
    );

    ws.current.onopen = () => {
      console.log("connected to websocket");
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
      console.log("websocket closed");
    };

    const fetchMessages = async () => {
      try {
        const msgs = await getUserMessagesByRoomId(roomId);
        setUserMessages(msgs);
      } catch (error) {
        console.error("error getting messages for room:", error);
      }
    };

    fetchMessages();

    return () => {
      ws.current?.close();
    };
  }, [roomId]);

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
  });

  const handleSendMessage = () => {
    if (!newMessage) {
      console.error("cannot send an empty message");
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(newMessage);
      setNewMessage("");
    }
  };

  return (
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
        <Button onClick={() => handleSendMessage()}>
          <Send />
        </Button>
      </div>
    </div>
  );
};

export default Messages;
