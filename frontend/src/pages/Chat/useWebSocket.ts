import { useEffect, useRef, useState } from "react";
import {
  IncomingPresence,
  IncomingTypingStatus,
  IncomingUserMessage,
  PresenceAction,
  Profile,
  Room,
  UserMessage,
} from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWebSocketContext } from "@/contexts/WebSocket";

interface UseWebSocketProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  onMessageReceived: (message: UserMessage) => void;
}

interface UseWebSocketReturn {
  activeRoom: Room | null;
  sendMessage: (content: string) => void;
  sendTypingStatus: () => void;
  joinRoom: (roomId: string) => void;
  typingProfiles: Set<string>;
  activeProfiles: Set<string>;
}

export const useWebSocket = ({
  rooms,
  setRooms,
  onMessageReceived,
}: UseWebSocketProps): UseWebSocketReturn => {
  const { profile } = useRequireAuth();
  const {
    sendMessage: wsSendMessage,
    sendTypingStatus: wsSendTypingStatus,
    joinRoom: wsJoinRoom,
    leaveRoom,
    onMessageReceived: onUserMessageReceived,
    onPresenceUpdate,
    onTypingStatus,
    onJoinRoomSuccess,
  } = useWebSocketContext();

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [typingProfilesSet, setTypingProfilesSet] = useState<Set<string>>(
    new Set(),
  );
  const [activeProfiles, setActiveProfiles] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const unsubscribeRefs = useRef<{
    unsubscribeUserMessage?: () => void;
    unsubscribePresence?: () => void;
    unsubscribeTyping?: () => void;
  }>({});

  const cleanupListeners = () => {
    if (unsubscribeRefs.current.unsubscribeUserMessage) {
      unsubscribeRefs.current.unsubscribeUserMessage();
    }
    if (unsubscribeRefs.current.unsubscribePresence) {
      unsubscribeRefs.current.unsubscribePresence();
    }
    if (unsubscribeRefs.current.unsubscribeTyping) {
      unsubscribeRefs.current.unsubscribeTyping();
    }
    unsubscribeRefs.current = {};
  };

  const setupListenersForRoom = (roomId: string) => {
    unsubscribeRefs.current.unsubscribeUserMessage = onUserMessageReceived(
      roomId,
      handleIncomingUserMessage,
    );
    unsubscribeRefs.current.unsubscribePresence = onPresenceUpdate(
      roomId,
      handleIncomingPresence,
    );
    unsubscribeRefs.current.unsubscribeTyping = onTypingStatus(
      roomId,
      handleIncomingTypingStatus,
    );
  };

  useEffect(() => {
    const unsubscribe = onJoinRoomSuccess((roomId: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setActiveRoom(room);
      }
    });

    return unsubscribe;
  }, [rooms, onJoinRoomSuccess]);

  useEffect(() => {
    return () => {
      cleanupListeners();
      cleanupTypingTimersRef();
    };
  }, []);

  const cleanupTypingTimersRef = () => {
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();
  };

  const handleIncomingUserMessage = (incomingMessage: IncomingUserMessage) => {
    const userMessage: UserMessage = incomingMessage;
    onMessageReceived(userMessage);
    setRooms((prev) => {
      if (!activeRoom?.id) return prev;

      if (prev.length > 0 && prev[0].id === activeRoom.id) {
        return prev;
      }

      const currentRoomIndex = prev.findIndex(
        (room) => room.id === activeRoom.id,
      );
      if (currentRoomIndex === -1) return prev;

      const currentRoom = prev[currentRoomIndex];
      const otherRooms = prev.filter((_, index) => index !== currentRoomIndex);

      return [currentRoom, ...otherRooms];
    });
    setTypingProfilesSet((prev) => {
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
          presence.profiles?.forEach((profile: Profile) => {
            newActiveProfiles.add(profile.userId);
          });
          break;
        }
        case PresenceAction.LEAVE: {
          presence.profiles?.forEach((profile: Profile) => {
            newActiveProfiles.delete(profile.userId);
          });
          break;
        }
      }
      return newActiveProfiles;
    });
  };

  const handleIncomingTypingStatus = (typingStatus: IncomingTypingStatus) => {
    setTypingProfilesSet((prev) => {
      const newTypingProfiles = new Set(prev);
      typingStatus.profiles?.forEach((profile: Profile) =>
        newTypingProfiles.add(profile.userId),
      );
      return newTypingProfiles;
    });

    typingStatus.profiles?.forEach((profile: Profile) => {
      const existingTimer = typingTimersRef.current.get(profile.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        setTypingProfilesSet((prev) => {
          const newTypingProfiles = new Set(prev);
          newTypingProfiles.delete(profile.userId);
          return newTypingProfiles;
        });

        typingTimersRef.current.delete(profile.userId);
      }, 5000);

      typingTimersRef.current.set(profile.userId, timer);
    });
  };

  const sendMessage = (content: string) => {
    if (!activeRoom) return;
    wsSendMessage(content, activeRoom.id);
  };

  const sendTypingStatus = () => {
    if (!activeRoom) return;
    wsSendTypingStatus(profile, activeRoom.id);
  };

  const joinRoom = (roomId: string) => {
    if (activeRoom?.id) {
      leaveRoom(activeRoom.id);
    }
    setTypingProfilesSet(new Set());
    setActiveProfiles(new Set());
    cleanupTypingTimersRef();
    cleanupListeners();
    setupListenersForRoom(roomId);
    wsJoinRoom(roomId);
  };

  return {
    activeRoom,
    sendMessage,
    sendTypingStatus,
    joinRoom,
    typingProfiles: typingProfilesSet,
    activeProfiles,
  };
};
