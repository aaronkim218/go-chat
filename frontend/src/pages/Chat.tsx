import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Message } from "../types";
import { deleteMessageById, getMessagesByRoomId } from "../api";
import useSessionContext from "../hooks/useSessionContext";
import { getJwt } from "../utils/jwt";

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const session = useSessionContext();
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms");
      return;
    }

    ws.current = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}/rooms/${roomId}`
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
      const message = JSON.parse(event.data) as Message;
      console.log("Message received:", message);
      setMessages((prev) => [...prev, message]);
    };

    const fetchMessages = async () => {
      try {
        const msgs = await getMessagesByRoomId(roomId);
        setMessages(msgs);
      } catch (error) {
        console.error("error getting messages for room:", error);
      }
    };

    fetchMessages();

    return () => {
      ws.current?.close();
    };
  }, []);

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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageById(messageId);
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (error) {
      console.error("error deleting message:", error);
    }
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <p>
              {message.author}: {message.content}
            </p>
            <button onClick={() => handleDeleteMessage(message.id)}>
              Delete
            </button>
            {/* {message.author === session.user.id && (
              <button onClick={() => handleDeleteMessage(message.id)}>
                Delete
              </button>
            )} */}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="Type a message..."
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={() => handleSendMessage()}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
