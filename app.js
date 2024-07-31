import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 8080 || process.env.PORT;
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://mychatbd.vercel.app",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Socket server runing..." });
});

// ================================================================

// Object to map user IDs to socket IDs
const userSocketMap = new Map();

io.on("connection", (socket) => {
  // Handle user ID registration
  socket.on("registerUser", (userId) => {
    console.log("registerUser:", userId);
    userSocketMap.set(userId, socket.id);
    const userList = Array.from(userSocketMap.entries()).map(
      ([userId, socketId]) => ({ userId, socketId })
    );
    io.emit("updateUsers", userList);
  });

  // Handle new message and send to the specific receiver
  socket.on("newMessage", (data) => {
    const { receiverId } = data;
    const receiverSocketId = userSocketMap.get(receiverId);

    console.log({ receiverSocketId, data });

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessageFromServer", data);
      socket.emit("newMessageFromServer", data);
    } else {
      console.log(`User with ID ${receiverId} is not connected.`);
    }
  });

  // Handle finding friend's socket by friendId
  socket.on("findFriendSocket", (friendId) => {
    const friendSocketId = userSocketMap.get(friendId);

    if (friendSocketId) {
      socket.emit("friendOnline", friendSocketId);
    } else {
      socket.emit("friendOffline", null);
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
  });

  socket.on("message", (data) => {
    console.log(data, { socket: socket.id });
  });
});

// ================================================================

// Server Listener
server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
