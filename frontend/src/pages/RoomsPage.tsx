import { useEffect, useState } from "react";
import { Room } from "../types";
import { createRoom, deleteRoom, getRoomsByUserId } from "../api";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";

const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { session } = useRequireAuth();
  const navigate = useNavigate();

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
      const newRoom = await createRoom([]);
      setRooms((prev) => [newRoom, ...prev]);
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
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <div>
              <button onClick={() => navigate(`/chat/${room.id}`)}>
                {room.id}
              </button>
              {room.host === session.user.id && (
                <button onClick={() => handleDeleteRoom(room.id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomsPage;
