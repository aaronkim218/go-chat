import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserMessage } from "../../../../types";
import { getUserMessagesByRoomId } from "../../../../api";
import { getJwt } from "../../../../utils/jwt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserMessageContainer from "@/components/features/chat/UserMessageContainer";

interface MessagesProps {
  roomId: string;
}

const Messages = ({ roomId }: MessagesProps) => {
  const navigate = useNavigate();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  // const [retries, setRetries] = useState(0);

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
      const userMessage = JSON.parse(event.data) as UserMessage;
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
    <div>
      <h1>Chat</h1>
      <div>
        {userMessages.map((userMessage) => (
          <UserMessageContainer
            key={userMessage.id}
            userMessage={userMessage}
            setUserMessages={setUserMessages}
          />
        ))}
      </div>
      <div>
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button onClick={() => handleSendMessage()}>Send</Button>
      </div>
    </div>
  );
};

export default Messages;
