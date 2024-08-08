"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const PORT = 8080 || process.env.PORT;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        // origin: "*",
        origin: "http://localhost:3000",
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
        userSocketMap.set(userId, socket.id);
        const userList = Array.from(userSocketMap.entries()).map(([userId, socketId]) => ({ userId, socketId }));
        io.emit("updateUsers", userList);
    });
    // Handle new message and send to the specific receiver
    socket.on("newMessage", (data) => {
        const { receiverId } = data;
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessageFromServer", data);
            socket.emit("newMessageFromServer", data);
        }
        else {
            console.log(`User with ID ${receiverId} is not connected.`);
        }
    });
    // Handle Friend Typing
    // Handle new message and send to the specific receiver
    socket.on("isTyping", (data) => {
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
        const userList = Array.from(userSocketMap.entries()).map(([userId, socketId]) => ({ userId, socketId }));
        io.emit("updateUsers", userList);
        io.emit("typing", { friendId: null, typing: false });
    });
});
// ================================================================
// Server Listener
server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
