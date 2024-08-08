import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { Message, Typing } from "../types";

const PORT = 8080 || process.env.PORT;
const app = express();

app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "*",
    origin: "https://jhalmuri.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Socket server runing..." });
});

// ================================================================

// Object to map user IDs to socket IDs
const userSocketMap = new Map<string, string>();

io.on("connection", (socket) => {
  // Handle user ID registration
  socket.on("registerUser", (userId: string) => {
    userSocketMap.set(userId, socket.id);

    const userList = Array.from(userSocketMap.entries()).map(
      ([userId, socketId]) => ({ userId, socketId })
    );

    io.emit("updateUsers", userList);
  });

  // Handle new message and send to the specific receiver
  socket.on("newMessage", (data: Message) => {
    const { receiverId } = data;
    const receiverSocketId = userSocketMap.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessageFromServer", data);
      socket.emit("newMessageFromServer", data);
    } else {
      console.log(`User with ID ${receiverId} is not connected.`);
    }
  });

  // Handle Friend Typing

  // Handle new message and send to the specific receiver
  socket.on("isTyping", (data: Typing) => {
    const { friendId } = data;
    const receiverId = friendId;

    const receiverSocketId = userSocketMap.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", data);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    for (let [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    const userList = Array.from(userSocketMap.entries()).map(
      ([userId, socketId]) => ({ userId, socketId })
    );
    io.emit("updateUsers", userList);
    io.emit("typing", { friendId: null, typing: false });
  });
});

// ================================================================

// Server Listener
server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
