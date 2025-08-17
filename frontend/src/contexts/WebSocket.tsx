import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getJwt } from "@/utils/jwt";
import { IncomingWSMessageSchema } from "@/schemas";
import {
  IncomingPresence,
  IncomingTypingStatus,
  IncomingUserMessage,
  IncomingWSMessageType,
  OutgoingJoinRoom,
  OutgoingLeaveRoom,
  OutgoingTypingStatus,
  OutgoingUserMessage,
  OutgoingWSMessage,
  OutgoingWSMessageType,
  Profile,
} from "@/types";
import camelcaseKeys from "camelcase-keys";
import snakecasekeys from "snakecase-keys";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

export interface WebSocketContextType {
  isConnected: boolean;
  pendingRoomJoin: string | null;
  sendMessage: (content: string, roomId: string) => void;
  sendTypingStatus: (profile: Profile, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  onMessageReceived: (
    roomId: string,
    callback: (message: IncomingUserMessage) => void,
  ) => () => void;
  onPresenceUpdate: (
    roomId: string,
    callback: (presence: IncomingPresence) => void,
  ) => () => void;
  onTypingStatus: (
    roomId: string,
    callback: (typingStatus: IncomingTypingStatus) => void,
  ) => () => void;
  onJoinRoomSuccess: (callback: (roomId: string) => void) => () => void;
  onJoinRoomError: (
    callback: (roomId: string, message: string) => void,
  ) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null,
);

const MAX_RETRIES = 3;
const RECONNECT_DELAY = 1000;

export const WebSocketProvider = ({
  children,
  profile,
}: {
  children: ReactNode;
  profile: Profile;
}) => {
  const navigate = useNavigate();
  const ws = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRoomJoin, setPendingRoomJoin] = useState<string | null>(null);

  const joinRoomSuccessListeners = useRef<((roomId: string) => void)[]>([]);
  const joinRoomErrorListeners = useRef<
    ((roomId: string, message: string) => void)[]
  >([]);

  const userMessageListeners = useRef<
    Map<string, ((message: IncomingUserMessage) => void)[]>
  >(new Map());
  const presenceListeners = useRef<
    Map<string, ((presence: IncomingPresence) => void)[]>
  >(new Map());
  const typingListeners = useRef<
    Map<string, ((typingStatus: IncomingTypingStatus) => void)[]>
  >(new Map());

  useEffect(() => {
    initWebSocket();

    return () => {
      cleanup();
    };
  }, [profile]);

  const cleanup = () => {
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setPendingRoomJoin(null);
    userMessageListeners.current.clear();
    presenceListeners.current.clear();
    typingListeners.current.clear();
    joinRoomSuccessListeners.current = [];
    joinRoomErrorListeners.current = [];
  };

  const initWebSocket = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    cleanup();

    ws.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);

    ws.current.onopen = () => {
      const jwt = getJwt();
      if (!jwt) {
        navigate("/");
        return;
      }

      if (ws.current?.readyState === WebSocket.OPEN) {
        console.log(jwt);
        ws.current.send(jwt);
        setIsConnected(true);
        retries.current = 0;
      }
    };

    ws.current.onmessage = (event) => {
      const data = camelcaseKeys(JSON.parse(event.data), { deep: true });

      try {
        const incomingWsMessage = IncomingWSMessageSchema.parse(data);

        switch (incomingWsMessage.type) {
          case IncomingWSMessageType.USER_MESSAGE: {
            const message = incomingWsMessage.data;
            const listeners =
              userMessageListeners.current.get(message.roomId) || [];
            listeners.forEach((callback) => callback(message));
            break;
          }
          case IncomingWSMessageType.PRESENCE: {
            const presence = incomingWsMessage.data;
            const listeners =
              presenceListeners.current.get(presence.roomId) || [];
            listeners.forEach((callback) => callback(presence));
            break;
          }
          case IncomingWSMessageType.TYPING_STATUS: {
            const typingStatus = incomingWsMessage.data;
            const listeners =
              typingListeners.current.get(typingStatus.roomId) || [];
            listeners.forEach((callback) => callback(typingStatus));
            break;
          }
          case IncomingWSMessageType.JOIN_ROOM_SUCCESS: {
            const { roomId } = incomingWsMessage.data;
            setPendingRoomJoin(null);
            joinRoomSuccessListeners.current.forEach((callback) =>
              callback(roomId),
            );
            break;
          }
          case IncomingWSMessageType.JOIN_ROOM_ERROR: {
            const { roomId, message } = incomingWsMessage.data;
            setPendingRoomJoin(null);
            toast.error(`Failed to join room: ${message}`);
            joinRoomErrorListeners.current.forEach((callback) =>
              callback(roomId, message),
            );
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
      setIsConnected(false);

      if (retries.current < MAX_RETRIES) {
        retries.current += 1;
        setTimeout(() => {
          initWebSocket();
        }, RECONNECT_DELAY * retries.current);
      }
    };

    ws.current.onerror = () => {
      setIsConnected(false);
    };
  };

  const sendData = <T,>(message: OutgoingWSMessage<T>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const data = snakecasekeys({ ...message }, { deep: true });
      ws.current.send(JSON.stringify(data));
    } else {
      toast.error("WebSocket is not connected");
    }
  };

  const sendUserMessage = (content: string, roomId: string) => {
    if (!content.trim()) {
      toast.warning("Cannot send an empty message");
      return;
    }

    const outgoingUserMessage: OutgoingUserMessage = {
      content,
      roomId,
    };

    const wsMessage: OutgoingWSMessage<OutgoingUserMessage> = {
      type: OutgoingWSMessageType.USER_MESSAGE,
      data: outgoingUserMessage,
    };

    sendData(wsMessage);
  };

  const sendTypingStatus = (profile: Profile, roomId: string) => {
    const outgoingTypingStatus: OutgoingTypingStatus = {
      profile,
      roomId,
    };

    const wsMessage: OutgoingWSMessage<OutgoingTypingStatus> = {
      type: OutgoingWSMessageType.TYPING_STATUS,
      data: outgoingTypingStatus,
    };

    sendData(wsMessage);
  };

  const joinRoom = (roomId: string) => {
    setPendingRoomJoin(roomId);

    const outgoingJoinRoom: OutgoingJoinRoom = {
      roomId,
    };

    const wsMessage: OutgoingWSMessage<OutgoingJoinRoom> = {
      type: OutgoingWSMessageType.JOIN_ROOM,
      data: outgoingJoinRoom,
    };

    sendData(wsMessage);

    setTimeout(() => {
      if (pendingRoomJoin === roomId) {
        setPendingRoomJoin(null);
        toast.error("Failed to join room - request timed out");
        joinRoomErrorListeners.current.forEach((callback) =>
          callback(roomId, "Request timed out"),
        );
      }
    }, 5000);
  };

  const leaveRoom = (roomId: string) => {
    const outgoingLeaveRoom: OutgoingLeaveRoom = {
      roomId,
    };

    const wsMessage: OutgoingWSMessage<OutgoingLeaveRoom> = {
      type: OutgoingWSMessageType.LEAVE_ROOM,
      data: outgoingLeaveRoom,
    };

    sendData(wsMessage);
  };

  const onMessageReceived = (
    roomId: string,
    callback: (message: IncomingUserMessage) => void,
  ) => {
    const listeners = userMessageListeners.current.get(roomId) || [];
    listeners.push(callback);
    userMessageListeners.current.set(roomId, listeners);

    return () => {
      const currentListeners = userMessageListeners.current.get(roomId) || [];
      const updatedListeners = currentListeners.filter((cb) => cb !== callback);
      if (updatedListeners.length === 0) {
        userMessageListeners.current.delete(roomId);
      } else {
        userMessageListeners.current.set(roomId, updatedListeners);
      }
    };
  };

  const onPresenceUpdate = (
    roomId: string,
    callback: (presence: IncomingPresence) => void,
  ) => {
    const listeners = presenceListeners.current.get(roomId) || [];
    listeners.push(callback);
    presenceListeners.current.set(roomId, listeners);

    return () => {
      const currentListeners = presenceListeners.current.get(roomId) || [];
      const updatedListeners = currentListeners.filter((cb) => cb !== callback);
      if (updatedListeners.length === 0) {
        presenceListeners.current.delete(roomId);
      } else {
        presenceListeners.current.set(roomId, updatedListeners);
      }
    };
  };

  const onTypingStatus = (
    roomId: string,
    callback: (typingStatus: IncomingTypingStatus) => void,
  ) => {
    const listeners = typingListeners.current.get(roomId) || [];
    listeners.push(callback);
    typingListeners.current.set(roomId, listeners);

    return () => {
      const currentListeners = typingListeners.current.get(roomId) || [];
      const updatedListeners = currentListeners.filter((cb) => cb !== callback);
      if (updatedListeners.length === 0) {
        typingListeners.current.delete(roomId);
      } else {
        typingListeners.current.set(roomId, updatedListeners);
      }
    };
  };

  const onJoinRoomSuccess = (callback: (roomId: string) => void) => {
    joinRoomSuccessListeners.current.push(callback);

    return () => {
      joinRoomSuccessListeners.current =
        joinRoomSuccessListeners.current.filter((cb) => cb !== callback);
    };
  };

  const onJoinRoomError = (
    callback: (roomId: string, message: string) => void,
  ) => {
    joinRoomErrorListeners.current.push(callback);

    return () => {
      joinRoomErrorListeners.current = joinRoomErrorListeners.current.filter(
        (cb) => cb !== callback,
      );
    };
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        pendingRoomJoin,
        sendMessage: sendUserMessage,
        sendTypingStatus,
        joinRoom,
        leaveRoom,
        onMessageReceived,
        onPresenceUpdate,
        onTypingStatus,
        onJoinRoomSuccess,
        onJoinRoomError,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);

  if (context === null) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }

  return context;
};
