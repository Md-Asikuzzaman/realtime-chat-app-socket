import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 8080 || process.env.PORT;
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "https://mychatbd.vercel.app",
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Socket server runing..." });
});

// Store user IDs and their associated socket IDs
const userSockets = new Map();

// Socket events
io.on("connection", (socket) => {
  // Register user who connected
  socket.on("registerUser", (userId) => {
    // Store the socket ID with userId as the key
    userSockets.set(userId, socket.id);
    socket.broadcast.emit("someone", socket.id);
  });

  socket.on("findFriendSocket", ({ userId, friendId }) => {
    // Check if the user is registered
    if (userSockets.has(userId)) {
      // Get the user's socket ID
      const userSocketId = userSockets.get(userId);

      // Assume you have a method to get the friend's socket ID
      // For simplicity, let's say you store both user and friend's IDs
      const friendSocketId = [...userSockets.entries()].find(
        ([key, value]) => key === friendId
      )?.[1];

      if (friendSocketId) {
        // Friend is online, emit an event with friend's socket ID
        io.to(userSocketId).emit("friendOnline", { friendId, friendSocketId });
      } else {
        // Friend is not online
        io.to(userSocketId).emit("friendOffline", { friendId });
      }
    } else {
      // User is not registered
      console.log(`User with ID ${userId} is not registered.`);
    }
  });

  // Handle sending a message to a specific user
  socket.on("newMessage", (message) => {
    const targetSocketId = userSockets.get(message.receiverId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("newServerMessage", {
        message,
        receiverId: message.receiverId,
        senderId: message.senderId,
      });
    }
  });

  socket.on("newMessage", (message) => {
    const targetSocketId = userSockets.get(message.receiverId);

    if (targetSocketId) {
      socket.emit("newServerMessage", {
        message,
        receiverId: message.receiverId,
        senderId: message.senderId,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Find and remove user from the map
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Server Listener
server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
