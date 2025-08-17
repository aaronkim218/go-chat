import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Rooms from "./components/Rooms/Rooms";
import { useEffect, useState } from "react";
import Messages from "./components/Messages/Messages";
import Details from "@/pages/Chat/components/Details/Details";
import { Room, UserMessage, Profile } from "@/types";
import { CornerDownLeft } from "lucide-react";
import { useWebSocket } from "./useWebSocket";
import { getProfilesByRoomId } from "@/api";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";
import { useWebSocketContext } from "@/contexts/WebSocket";

const Chat = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [profilesHashMap, setProfilesHashMap] = useState<Map<string, Profile>>(
    new Map(),
  );

  const { pendingRoomJoin } = useWebSocketContext();
  const {
    activeRoom,
    sendMessage,
    sendTypingStatus,
    joinRoom,
    typingProfiles,
    activeProfiles,
  } = useWebSocket({
    rooms,
    setRooms,
    onMessageReceived: (message: UserMessage) => {
      setUserMessages((prev) => [...prev, message]);
    },
  });

  useEffect(() => {
    setUserMessages([]);
    if (activeRoom) {
      fetchProfiles(activeRoom.id);
    } else {
      setProfilesHashMap(new Map());
    }
  }, [activeRoom]);

  const fetchProfiles = async (roomId: string) => {
    try {
      const profiles = await getProfilesByRoomId(roomId);
      const profilesMap = new Map<string, Profile>();
      profiles.forEach((profile) => {
        profilesMap.set(profile.userId, profile);
      });
      setProfilesHashMap(profilesMap);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  const updateProfilesHashMap = (newProfiles: Profile[]) => {
    setProfilesHashMap((prev) => {
      const updatedMap = new Map(prev);
      newProfiles.forEach((profile) => {
        updatedMap.set(profile.userId, profile);
      });
      return updatedMap;
    });
  };

  const handleRoomSelect = (room: Room) => {
    // Don't rejoin if already in this room
    if (activeRoom?.id === room.id) {
      return;
    }
    joinRoom(room.id);
  };

  return (
    <div className=" w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15} minSize={15}>
          <Rooms
            activeRoom={activeRoom}
            onRoomSelect={handleRoomSelect}
            rooms={rooms}
            setRooms={setRooms}
            pendingRoomJoin={pendingRoomJoin}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={45}>
          <Messages
            activeRoom={activeRoom}
            userMessages={userMessages}
            setUserMessages={setUserMessages}
            sendMessage={sendMessage}
            sendTypingStatus={sendTypingStatus}
            typingProfilesSet={typingProfiles}
            profilesHashMap={profilesHashMap}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={25}>
          {activeRoom ? (
            <Details
              activeRoom={activeRoom}
              setRooms={setRooms}
              setActiveRoom={() => {}} // No longer used - managed by useWebSocket
              activeProfiles={activeProfiles}
              profilesHashMap={profilesHashMap}
              updateProfilesHashMap={updateProfilesHashMap}
            />
          ) : (
            <div className=" flex flex-col justify-center items-center h-full text-2xl">
              What they said
              <CornerDownLeft className=" mt-4 scale-200" />
            </div>
          )}{" "}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Chat;
