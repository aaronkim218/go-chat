import axios from "axios";
import { Message, Profile, Room } from "./types";
import { getJwt } from "./utils/jwt";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

axios.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

export const getRoomsByUserId = async (): Promise<Room[]> => {
  const res = await axios.get(`${BASE_URL}/rooms`);

  if (res.status !== 200) {
    throw new Error("failed to fetch rooms");
  }

  return res.data;
};

export const createRoom = async (members: string[]): Promise<Room> => {
  const res = await axios.post(`${BASE_URL}/rooms`, { members: members });

  if (res.status !== 201) {
    throw new Error(`failed to create room'`);
  }

  return res.data;
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  const res = await axios.delete(`${BASE_URL}/rooms/${roomId}`);

  if (res.status !== 204) {
    throw new Error(`failed to delete room with id='${roomId}'`);
  }
};

export const deleteMessageById = async (messageId: string): Promise<void> => {
  const res = await axios.delete(`${BASE_URL}/messages/${messageId}`);

  if (res.status !== 204) {
    throw new Error(`failed to delete message with id='${messageId}'`);
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

export const addUsersToRoom = async (
  roomId: string,
  userIds: string[]
): Promise<void> => {
  const res = await axios.post(`${BASE_URL}/rooms/${roomId}/users`, {
    user_ids: userIds,
  });

  if (res.status !== 201) {
    throw new Error(`failed to add users to room`);
  }
};

export const getProfileByUserId = async (): Promise<Profile> => {
  const res = await axios.get(`${BASE_URL}/profiles`);

  if (res.status !== 200) {
    throw new Error(`failed to fetch profile for user`);
  }

  return res.data;
};
