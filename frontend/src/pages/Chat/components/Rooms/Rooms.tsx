import { useEffect, useState } from "react";
import { CreateRoomRequest, Room } from "../../../../types";
import { createRoom, deleteRoom, getRoomsByUserId } from "../../../../api";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

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
      <button onClick={() => handleCreateRoom()}>Create Room</button>
      <input
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
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <div>
              <button onClick={() => setRoomId(room.id)}>
                Name: {room.name} - Id: {room.id}
              </button>
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
