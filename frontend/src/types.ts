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
