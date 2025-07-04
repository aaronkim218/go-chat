import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Rooms from "./components/Rooms/Rooms";
import { useState } from "react";
import Messages from "./components/Messages/Messages";
import Details from "@/pages/Chat/components/Details/Details";
import { Room } from "@/types";
import { CornerDownLeft } from "lucide-react";

const Chat = () => {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  return (
    <div className=" w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15}>
          <Rooms
            activeRoom={activeRoom}
            setActiveRoom={setActiveRoom}
            rooms={rooms}
            setRooms={setRooms}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={55}>
          {activeRoom ? (
            <Messages roomId={activeRoom.id} />
          ) : (
            <div className=" flex flex-col justify-center items-center h-full text-2xl">
              You need to select a room first
              <CornerDownLeft className=" mt-4 scale-200" />
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={30}>
          {activeRoom ? (
            <Details
              activeRoom={activeRoom}
              setRooms={setRooms}
              setActiveRoom={setActiveRoom}
            />
          ) : (
            <div className=" flex flex-col justify-center items-center h-full text-2xl">
              What he said
              <CornerDownLeft className=" mt-4 scale-200" />
            </div>
          )}{" "}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Chat;
