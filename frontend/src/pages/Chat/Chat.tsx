import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Rooms from "./components/Rooms/Rooms";
import { useState } from "react";
import Messages from "./components/Messages/Messages";
import Details from "./components/Details/Details";

const Chat = () => {
  const [roomId, setRoomId] = useState<string | null>(null);

  return (
    <div className=" w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <Rooms setRoomId={setRoomId} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          {roomId ? (
            <Messages roomId={roomId} />
          ) : (
            <div>Select a room for messages</div>
          )}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          {roomId ? (
            <Details roomId={roomId} />
          ) : (
            <div>Select a room for details</div>
          )}{" "}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Chat;
