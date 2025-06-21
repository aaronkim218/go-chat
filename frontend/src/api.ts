import axios from "axios";
import {
  BulkResult,
  CreateRoomResponse,
  Profile,
  Room,
  SearchProfilesOptions,
  UserMessage,
} from "./types";
import { getJwt } from "./utils/jwt";
import applyCaseMiddleware from "axios-case-converter";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const baseAxios = axios.create();
baseAxios.defaults.validateStatus = () => true;

baseAxios.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

const client = applyCaseMiddleware(baseAxios);

export const getRoomsByUserId = async (): Promise<Room[]> => {
  const res = await client.get(`${BASE_URL}/rooms`);

  if (res.status !== 200) {
    throw new Error("failed to fetch rooms");
  }

  return res.data;
};

export const createRoom = async (
  members: string[],
): Promise<CreateRoomResponse> => {
  const res = await client.post(`${BASE_URL}/rooms`, { members: members });

  if (res.status !== 201) {
    throw new Error(`failed to create room'`);
  }

  return res.data;
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  const res = await client.delete(`${BASE_URL}/rooms/${roomId}`);

  if (res.status !== 204) {
    throw new Error(`failed to delete room with id='${roomId}'`);
  }
};

export const deleteMessageById = async (messageId: string): Promise<void> => {
  const res = await client.delete(`${BASE_URL}/messages/${messageId}`);

  if (res.status !== 204) {
    throw new Error(`failed to delete message with id='${messageId}'`);
  }
};

export const getUserMessagesByRoomId = async (
  roomId: string,
): Promise<UserMessage[]> => {
  const res = await client.get(`${BASE_URL}/rooms/${roomId}/messages`);

  if (res.status !== 200) {
    throw new Error(`failed to fetch messages for room with id='${roomId}'`);
  }

  return res.data;
};

export const addUsersToRoom = async (
  roomId: string,
  userIds: string[],
): Promise<BulkResult<string>> => {
  const res = await client.post(`${BASE_URL}/rooms/${roomId}/users`, {
    user_ids: userIds,
  });

  if (res.status !== 201) {
    throw new Error(`failed to add users to room`);
  }

  return res.data;
};

export const getProfileByUserId = async (): Promise<Profile | null> => {
  const res = await client.get(`${BASE_URL}/profiles`);

  if (res.status === 200) {
    return res.data;
  } else if (res.status === 404) {
    return null;
  }

  throw new Error(`failed to fetch profile for user`);
};

export const patchProfileByUserId = async (
  partialProfile: Partial<Profile>,
): Promise<void> => {
  const res = await client.patch(`${BASE_URL}/profiles`, partialProfile);

  if (res.status !== 204) {
    throw new Error(`failed to update profile for user`);
  }
};

export interface CreateProfileRequest {
  username: string;
}

export const createProfile = async (
  req: CreateProfileRequest,
): Promise<void> => {
  const res = await client.post(`${BASE_URL}/profiles`, req);

  if (res.status !== 201) {
    throw new Error(`failed to create profile for user`);
  }
};

export const searchProfiles = async (
  req: SearchProfilesOptions,
): Promise<Profile[]> => {
  const res = await client.get(`${BASE_URL}/profiles/search`, {
    params: req,
  });

  if (res.status !== 200) {
    throw new Error(`failed to create profile for user`);
  }

  return res.data;
};
