import * as z from "zod/v4";
import {
  BulkResultStringSchema,
  CreateRoomResponseSchema,
  MessageSchema,
  PatchProfileRequestSchema,
  PatchProfileResponseSchema,
  ProfileSchema,
  RoomSchema,
  UserMessageSchema,
} from "./schemas";

export type Failure<T> = {
  item: T;
  message: string;
};

export type BulkResult<T> = {
  successes: T[];
  failures: Failure<T>[];
};

export interface SearchProfilesOptions {
  username: string;
  limit?: number;
  offset?: number;
  excludeRoom?: string;
}

export interface CreateRoomRequest {
  name: string;
  members: string[];
}

export type Message = z.infer<typeof MessageSchema>;

export type UserMessage = z.infer<typeof UserMessageSchema>;

export type Profile = z.infer<typeof ProfileSchema>;

export type PatchProfileRequest = z.infer<typeof PatchProfileRequestSchema>;

export type PatchProfileResponse = z.infer<typeof PatchProfileResponseSchema>;

export type Room = z.infer<typeof RoomSchema>;

export type BulkResultString = z.infer<typeof BulkResultStringSchema>;

export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export interface OutgoingUserMessage {
  content: string;
}

export enum WSMessageType {
  USER_MESSAGE = "USER_MESSAGE",
}

export interface WSMessage<T> {
  type: WSMessageType;
  payload: T;
}
