export interface Message {
  message: string;
  senderId: string;
  receiverId: string;
  type: string;
  createdAt: DateTime;
}

export interface Typing {
  friendId: string;
  typing: boolean;
}
