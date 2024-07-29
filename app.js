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

// Socket events
io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("newMessage", (message) => {
    console.log(message);
    io.emit("newServerMessage", message);
  });
});

// Server Listener
server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
