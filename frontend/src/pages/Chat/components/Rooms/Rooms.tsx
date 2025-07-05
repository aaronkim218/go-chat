import React, { useEffect, useState } from "react";
import { CreateRoomRequest, Room } from "@/types";
import { createRoom, getRoomsByUserId } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface RoomsProps {
  setActiveRoom: (room: Room) => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const Rooms = ({ setActiveRoom, rooms, setRooms }: RoomsProps) => {
  const [createRoomRequest, setCreateRoomRequest] = useState<CreateRoomRequest>(
    { name: "", members: [] },
  );

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await getRoomsByUserId();
        setRooms(response);
      } catch (error) {
        console.error("error getting rooms by user id:", error);
      }
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!createRoomRequest.name) {
      console.error("Room name is required");
      return;
    }

    try {
      const resp = await createRoom(createRoomRequest);
      setRooms((prev) => [resp.room, ...prev]);
    } catch (error) {
      console.error("error creating room:", error);
    }
  };

  return (
    <div>
      <h1>Rooms</h1>
      <Separator />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"secondary"}>Create Room</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter room details</DialogTitle>
            <DialogDescription>
              Enter a name for the room cmon
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Room Name"
            value={createRoomRequest.name}
            onChange={(e) =>
              setCreateRoomRequest({
                ...createRoomRequest,
                name: e.target.value,
              })
            }
          />
          <DialogFooter>
            {/* <DialogClose asChild> */}
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleCreateRoom()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <div>
              <Button variant={"outline"} onClick={() => setActiveRoom(room)}>
                {room.name}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
