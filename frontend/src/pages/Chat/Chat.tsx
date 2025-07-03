import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Rooms from "./components/Rooms/Rooms";
import { useState } from "react";
import Messages from "./components/Messages/Messages";

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
          {roomId ? <Messages roomId={roomId} /> : <div>Select a room</div>}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Three</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Chat;
