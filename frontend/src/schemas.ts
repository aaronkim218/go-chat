import * as z from "zod/v4";
import { IncomingWSMessageType } from "./types";

export const MessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  author: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const UserMessageSchema = MessageSchema.merge(
  z.object({
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
);

export const ProfileSchema = z.object({
  userId: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PatchProfileRequestSchema = z.object({
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const PatchProfileResponseSchema = z.object({
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  updatedAt: z.coerce.date(),
});

export const RoomSchema = z.object({
  id: z.string(),
  host: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const FailureSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    item: itemSchema,
    message: z.string(),
  });

const BulkResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    successes: z.array(itemSchema).nullable(),
    failures: z.array(FailureSchema(itemSchema)).nullable(),
  });

export const BulkResultStringSchema = BulkResultSchema(z.string());

export const CreateRoomResponseSchema = z.object({
  room: RoomSchema,
  membersResults: BulkResultSchema(z.string()),
});

export const IncomingPresenceSchema = z.object({
  roomId: z.string(),
  profiles: z.array(ProfileSchema).nullable(),
  action: z.enum(["JOIN", "LEAVE"]),
});

export const IncomingTypingStatusSchema = z.object({
  roomId: z.string(),
  profiles: z.array(ProfileSchema).nullable(),
});

export const IncomingJoinRoomSuccessSchema = z.object({
  roomId: z.string(),
});

export const IncomingJoinRoomErrorSchema = z.object({
  roomId: z.string(),
  message: z.string(),
});

export const IncomingWSMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(IncomingWSMessageType.USER_MESSAGE),
    data: UserMessageSchema,
  }),
  z.object({
    type: z.literal(IncomingWSMessageType.PRESENCE),
    data: IncomingPresenceSchema,
  }),
  z.object({
    type: z.literal(IncomingWSMessageType.TYPING_STATUS),
    data: IncomingTypingStatusSchema,
  }),
  z.object({
    type: z.literal(IncomingWSMessageType.JOIN_ROOM_SUCCESS),
    data: IncomingJoinRoomSuccessSchema,
  }),
  z.object({
    type: z.literal(IncomingWSMessageType.JOIN_ROOM_ERROR),
    data: IncomingJoinRoomErrorSchema,
  }),
]);
