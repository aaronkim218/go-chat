import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Message } from "../types";

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms");
      return;
    }

    ws.current = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}/rooms/${roomId}/ws`
    );

    ws.current.onmessage = (event) => {
      console.log("Message received:", event.data);
    };

    const fetchMessages = () => {};

    fetchMessages();
  }, []);

  const handleSendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ content: newMessage }));
      setNewMessage("");
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
