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

const Chat = () => {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  return (
    <div className=" w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15}>
          <Rooms
            setActiveRoom={setActiveRoom}
            rooms={rooms}
            setRooms={setRooms}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={65}>
          {activeRoom ? (
            <Messages roomId={activeRoom.id} />
          ) : (
            <div>Select a room for messages</div>
          )}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20}>
          {activeRoom ? (
            <Details activeRoom={activeRoom} setRooms={setRooms} />
          ) : (
            <div>Select a room for details</div>
          )}{" "}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Chat;
