import { useEffect, useState } from "react";
import { CreateRoomRequest, Room } from "../../../../types";
import { createRoom, deleteRoom, getRoomsByUserId } from "../../../../api";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
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

interface RoomsProps {
  setRoomId: (roomId: string) => void;
}

const Rooms = ({ setRoomId }: RoomsProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { session } = useRequireAuth();
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

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("error deleting room:", error);
    }
  };

  return (
    <div>
      <h1>Rooms</h1>
      <Dialog>
        <DialogTrigger>
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
            <DialogClose>
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
              <Button variant={"outline"} onClick={() => setRoomId(room.id)}>
                Name: {room.name} - Id: {room.id}
              </Button>
              {room.host === session.user.id && (
                <Button onClick={() => handleDeleteRoom(room.id)}>
                  <Trash />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
