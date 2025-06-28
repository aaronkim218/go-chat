import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Profile, SearchProfilesOptions, UserMessage } from "../types";
import {
  addUsersToRoom,
  deleteMessageById,
  getProfilesByRoomId,
  getUserMessagesByRoomId,
} from "../api";
import { getJwt } from "../utils/jwt";
import { useRequireAuth } from "../hooks/useRequireAuth";
import UserSuggestionSearch from "../components/UserSuggestionSearch";

const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const { session } = useRequireAuth();
  // const [retries, setRetries] = useState(0);
  const [newUsers, setNewUsers] = useState<string[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
    excludeRoom: roomId,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms");
      return;
    }

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

    const fetchProfiles = async () => {
      try {
        const profiles = await getProfilesByRoomId(roomId);
        setProfiles(profiles);
      } catch (error) {
        console.error("error getting profiles for room:", error);
      }
    };

    fetchMessages();
    fetchProfiles();

    return () => {
      ws.current?.close();
    };
  }, []);

  if (roomId) {
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
        setUserMessages((prev) =>
          prev.filter((message) => message.id !== messageId),
        );
      } catch (error) {
        console.error("error deleting message:", error);
      }
    };

    const handleAddUsersToRoom = async () => {
      try {
        const resp = await addUsersToRoom(roomId, newUsers);
        console.log("TODO: do something with addUsersToRoom response: ", resp);
      } catch (error) {
        console.error("error adding users to room:", error);
      }
    };

    return (
      <div>
        <h1>Chat</h1>
        <div>
          <h6 className="">Profiles</h6>
          <ul>
            {profiles.map((profile) => (
              <li key={profile.userId}>
                {profile.username} ({profile.firstName} {profile.lastName})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Add new users</h2>
          <UserSuggestionSearch
            searchOptions={searchOptions}
            setSearchOptions={setSearchOptions}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            handleClick={(userId: string) => {
              setNewUsers((prev) => [...prev, userId]);
              setSearchOptions({ ...searchOptions, username: "" });
            }}
          />
          <button onClick={() => handleAddUsersToRoom()}>Submit users</button>
          <ul>
            {newUsers.map((user, index) => (
              <li key={index}>
                {user}
                <button
                  onClick={() =>
                    setNewUsers((prev) => prev.filter((u) => u !== user))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {userMessages.map((message) => (
            <div key={message.id}>
              <p>
                {message.username}: {message.content}
              </p>
              {message.author === session.user.id && (
                <button onClick={() => handleDeleteMessage(message.id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
        <div>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button onClick={() => handleSendMessage()}>Send</button>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Chat</h1>
        <p>No room selected</p>
      </div>
    );
  }
};

export default ChatPage;
