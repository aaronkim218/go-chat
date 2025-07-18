import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJwt } from "@/utils/jwt";
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
import snakecasekeys from "snakecase-keys";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface UseWebSocketProps {
  activeRoom: Room | null;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setActiveProfiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  onMessageReceived: (message: UserMessage) => void;
}

const MAX_RETRIES = 3;

export const useWebSocket = ({
  activeRoom,
  setRooms,
  setActiveProfiles,
  onMessageReceived,
}: UseWebSocketProps) => {
  const navigate = useNavigate();
  const { profile } = useRequireAuth();
  const ws = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const activeRoomRef = useRef<Room | null>(activeRoom);
  const [typingProfiles, setTypingProfiles] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setTypingProfiles(new Set());
    activeRoomRef.current = activeRoom;
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();

    if (activeRoomRef.current) {
      initWebsocket(activeRoomRef.current.id);
    }

    return () => {
      activeRoomRef.current = null;
      ws.current?.close();
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
    };
  }, [activeRoom]);

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
    onMessageReceived(userMessage);
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

  const handleWriteData = <T>(outgoingMsg: OutgoingWSMessage<T>) => {
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

  const sendMessage = (content: string) => {
    if (!content) {
      toast.warning("cannot send an empty message");
      return;
    }

    const outgoingUserMessage: OutgoingUserMessage = {
      content,
    };

    const wsMessage: OutgoingWSMessage<OutgoingUserMessage> = {
      type: WSMessageType.USER_MESSAGE,
      payload: outgoingUserMessage,
    };

    handleWriteData(wsMessage);
  };

  const sendTypingStatus = () => {
    const outgoingTypingStatus: OutgoingTypingStatus = {
      profile: profile,
    };

    const wsMessage: OutgoingWSMessage<OutgoingTypingStatus> = {
      type: WSMessageType.TYPING_STATUS,
      payload: outgoingTypingStatus,
    };

    handleWriteData(wsMessage);
  };

  return {
    sendMessage,
    sendTypingStatus,
    typingProfiles,
  };
};
