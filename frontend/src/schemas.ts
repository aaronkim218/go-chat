import * as z from "zod/v4";

export const MessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  createdAt: z.coerce.date(),
  author: z.string(),
  content: z.string(),
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
});

export const RoomSchema = z.object({
  id: z.string(),
  host: z.string(),
  name: z.string(),
});

const FailureSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    item: itemSchema,
    message: z.string(),
  });

const BulkResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    successes: z.array(itemSchema),
    failures: z.array(FailureSchema(itemSchema)),
  });

export const BulkResultStringSchema = BulkResultSchema(z.string());

export const CreateRoomResponseSchema = z.object({
  room: RoomSchema,
  membersResults: BulkResultSchema(z.string()),
});
