export interface Room {
  id: string;
  host: string;
}

export interface Message {
  id: string;
  roomId: string;
  createdAt: Date;
  author: string;
  content: string;
}

export interface Profile {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
}

export type UserMessage = Message & {
  username: string;
  firstName: string;
  lastName: string;
};

export interface CreateRoomResponse {
  room: Room;
  membersResults: BulkResult<string>;
}

export type Failure<T> = {
  item: T;
  error: Error;
};

export type BulkResult<T> = {
  successes: T[];
  failures: Failure<T>[];
};
