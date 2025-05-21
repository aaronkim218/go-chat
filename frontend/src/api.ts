import axios from "axios";
import { Message, Room } from "./types";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

export const getRoomsByUserId = async (userId: string): Promise<Room[]> => {
  const res = await axios.get(`${BASE_URL}/rooms?userId=${userId}`);

  if (res.status !== 200) {
    throw new Error("failed to fetch rooms");
  }

  return res.data;
};

export const createRoom = async (host: string): Promise<Room> => {
  const res = await axios.post(`${BASE_URL}/rooms`, { host: host });

  if (res.status !== 201) {
    throw new Error(`failed to create room with host='${host}'`);
  }

  return res.data;
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  const res = await axios.delete(`${BASE_URL}/rooms/${roomId}`);

  if (res.status !== 204) {
    throw new Error(`failed to delete room with id='${roomId}'`);
  }
};

export const getMessagesByRoomId = async (
  roomId: string
): Promise<Message[]> => {
  const res = await axios.get(`${BASE_URL}/rooms/${roomId}/messages`);

  if (res.status !== 200) {
    throw new Error(`failed to fetch messages for room with id='${roomId}'`);
  }

  return res.data;
};
