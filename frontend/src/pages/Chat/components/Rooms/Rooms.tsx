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
  activeRoom: Room | null;
  setActiveRoom: (room: Room) => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const Rooms = ({ activeRoom, setActiveRoom, rooms, setRooms }: RoomsProps) => {
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
    try {
      const resp = await createRoom(createRoomRequest);
      setRooms((prev) => [resp.room, ...prev]);
    } catch (error) {
      console.error("error creating room:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      Rooms
      <Separator />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"secondary"}>New Room</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter room name</DialogTitle>
            <DialogDescription>
              Leave blank for default room name
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
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => (
          <li className=" w-full" key={room.id}>
            <Button
              className=" w-full"
              variant={room.id === activeRoom?.id ? "secondary" : "ghost"}
              onClick={() => setActiveRoom(room)}
            >
              {room.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
