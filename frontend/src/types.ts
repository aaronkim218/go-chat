import * as z from "zod/v4";
import {
  BulkResultStringSchema,
  CreateRoomResponseSchema,
  IncomingPresenceSchema,
  IncomingTypingStatusSchema,
  IncomingJoinRoomSuccessSchema,
  IncomingJoinRoomErrorSchema,
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

export enum IncomingWSMessageType {
  USER_MESSAGE = "USER_MESSAGE",
  PRESENCE = "PRESENCE",
  TYPING_STATUS = "TYPING_STATUS",
  JOIN_ROOM_SUCCESS = "JOIN_ROOM_SUCCESS",
  JOIN_ROOM_ERROR = "JOIN_ROOM_ERROR",
}

export enum OutgoingWSMessageType {
  USER_MESSAGE = "USER_MESSAGE",
  TYPING_STATUS = "TYPING_STATUS",
  JOIN_ROOM = "JOIN_ROOM",
  LEAVE_ROOM = "LEAVE_ROOM",
}

// Legacy enum for backwards compatibility during transition
export enum WSMessageType {
  USER_MESSAGE = "USER_MESSAGE",
  PRESENCE = "PRESENCE",
  TYPING_STATUS = "TYPING_STATUS",
  JOIN_ROOM = "JOIN_ROOM",
  JOIN_ROOM_SUCCESS = "JOIN_ROOM_SUCCESS",
  JOIN_ROOM_ERROR = "JOIN_ROOM_ERROR",
  LEAVE_ROOM = "LEAVE_ROOM",
}

export enum PresenceAction {
  JOIN = "JOIN",
  LEAVE = "LEAVE",
}

export interface OutgoingWSMessage<T> {
  type: OutgoingWSMessageType;
  data: T;
}

// WebSocket Incoming Types (Server → Client)
export type IncomingUserMessage = UserMessage;
export type IncomingPresence = z.infer<typeof IncomingPresenceSchema>;
export type IncomingTypingStatus = z.infer<typeof IncomingTypingStatusSchema>;
export type IncomingJoinRoomSuccess = z.infer<
  typeof IncomingJoinRoomSuccessSchema
>;
export type IncomingJoinRoomError = z.infer<typeof IncomingJoinRoomErrorSchema>;

// WebSocket Outgoing Types (Client → Server)
export interface OutgoingUserMessage {
  content: string;
  roomId: string;
}

export interface OutgoingTypingStatus {
  profile: Profile;
  roomId: string;
}

export interface OutgoingJoinRoom {
  roomId: string;
}

export interface OutgoingLeaveRoom {
  roomId: string;
}
