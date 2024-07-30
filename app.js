import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 8080 || process.env.PORT;
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
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
  console.log(socket.id);

  // register user who connected
  socket.on("registerUser", (userId) => {
    userSockets.set(userId, socket.id);

    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  // send message to a specific user

  // Handle sending a message to a specific user
  socket.on("newMessage", (message) => {
    const targetSocketId = userSockets.get(message.receiverId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("newServerMessage", {
        message,
        receiverId: message.receiverId,
        senderId: message.senderId,
      });
      console.log(`Private message sent to ${message.senderId}`);
    } else {
      console.log(`User ${message.senderId} not found`);
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
      console.log(`Private message sent to ${message.senderId}`);
    } else {
      console.log(`User ${message.senderId} not found`);
    }
  });

  //   socket.on("newMessage", (message) => {
  //     socket.emit("newServerMessage", message);
  //   });

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
