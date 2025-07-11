import axios from "axios";
import {
  BulkResultString,
  CreateRoomRequest,
  CreateRoomResponse,
  PatchProfileResponse,
  Profile,
  Room,
  SearchProfilesOptions,
  UserMessage,
} from "@/types";
import { getJwt } from "@/utils/jwt";
import applyCaseMiddleware from "axios-case-converter";
import {
  BulkResultStringSchema,
  CreateRoomResponseSchema,
  PatchProfileResponseSchema,
  ProfileSchema,
  RoomSchema,
  UserMessageSchema,
} from "./schemas";
import * as z from "zod/v4";

const BASE_URL = import.meta.env.VITE_SERVER_URL;
const IDEMPOTENCY_HEADER = "X-Idempotency-Key";
const CACHE_CONTROL_HEADER = "Cache-Control";

const baseAxios = axios.create();
baseAxios.defaults.validateStatus = () => true;

baseAxios.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

const client = applyCaseMiddleware(baseAxios, {
  ignoreParams: true,
});

export const getRoomsByUserId = async (): Promise<Room[]> => {
  const res = await client.get(`${BASE_URL}/rooms`, {
    headers: {
      [CACHE_CONTROL_HEADER]: "no-store",
    },
  });

  if (res.status !== 200) {
    throw new Error("failed to fetch rooms");
  }

  return z.array(RoomSchema).parse(res.data);
};

export const createRoom = async (
  req: CreateRoomRequest,
): Promise<CreateRoomResponse> => {
  const res = await client.post(`${BASE_URL}/rooms`, req);

  if (res.status !== 201) {
    throw new Error(`failed to create room'`);
  }

  return CreateRoomResponseSchema.parse(res.data);
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

  return z.array(UserMessageSchema).parse(res.data);
};

export const addUsersToRoom = async (
  roomId: string,
  userIds: string[],
): Promise<BulkResultString> => {
  const res = await client.post(`${BASE_URL}/rooms/${roomId}/users`, {
    user_ids: userIds,
  });

  if (res.status !== 200) {
    throw new Error(`failed to add users to room`);
  }

  return BulkResultStringSchema.parse(res.data);
};

export const getProfileByUserId = async (): Promise<Profile | null> => {
  const res = await client.get(`${BASE_URL}/profiles`);

  if (res.status === 200) {
    return ProfileSchema.parse(res.data);
  } else if (res.status === 404) {
    return null;
  }

  throw new Error(`failed to fetch profile for user`);
};

export const getForeignProfileByUserId = async (
  profileId: string,
): Promise<Profile> => {
  const res = await client.get(`${BASE_URL}/profiles`);

  if (res.status !== 200) {
    throw new Error(`failed to fetch profile for user with id='${profileId}'`);
  }

  return ProfileSchema.parse(res.data);
};

export const patchProfileByUserId = async (
  partialProfile: Partial<Profile>,
  idempotencyKey: string,
): Promise<PatchProfileResponse> => {
  const res = await client.patch(`${BASE_URL}/profiles`, partialProfile, {
    headers: {
      [IDEMPOTENCY_HEADER]: idempotencyKey,
    },
  });

  if (res.status !== 200) {
    throw new Error(`failed to update profile for user`);
  }

  return PatchProfileResponseSchema.parse(res.data);
};

export interface CreateProfileRequest {
  username: string;
  firstName: string;
  lastName: string;
}

export const createProfile = async (
  req: CreateProfileRequest,
  idempotencyKey: string,
): Promise<Profile> => {
  const res = await client.post(`${BASE_URL}/profiles`, req, {
    headers: {
      [IDEMPOTENCY_HEADER]: idempotencyKey,
    },
  });

  if (res.status !== 201) {
    throw new Error(`failed to create profile for user`);
  }

  return ProfileSchema.parse(res.data);
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

  return z.array(ProfileSchema).parse(res.data);
};

export const getProfilesByRoomId = async (
  roomId: string,
): Promise<Profile[]> => {
  const res = await client.get(`${BASE_URL}/rooms/${roomId}/profiles`);

  if (res.status !== 200) {
    throw new Error(`failed to get profiles by room id='${roomId}'`);
  }

  return z.array(ProfileSchema).parse(res.data);
};
