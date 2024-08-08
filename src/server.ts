import express, { Express } from "express";
import { PORT } from "./secrets";
import rootRouter from "./routes";
import { errorMiddleware } from "./middlewares/errors";
import cors from "cors";
import chatRoutes from "./routes/chat";
import { createServer } from "http";
import { Server } from "socket.io";
import { prismaClient } from "./db/prisma";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "./secrets";
const app: Express = express();
const server = createServer(app); // Create HTTP server with Express
//initialize socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Update this with your front-end URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/api", rootRouter);
app.use("/api/chat", chatRoutes); // Add chat routes
app.use(errorMiddleware);

let token = "";

io.use(async (socket, next) => {
  console.log("socket.handshake.auth.token", socket.handshake.auth.token);
  token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as any; // Assuming you're using JWT
    const user = await prismaClient.user.findFirst({
      where: { id: decodedToken.userId },
    });

    if (user) {
      //   socket.user  = user; // Attach the user to the socket
      next();
    } else {
      next(new Error("Authentication error"));
    }
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ eid }) => {
    console.log("eventId using", eid);
    socket.join(eid);
    const messages = await prismaClient.message.findMany({
      where: { chatRoom: { eventId: eid } },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    io.to(eid).emit("messages", messages);

    // Check if the user has booked the event
    const decodedToken = jwt.verify(token as string, JWT_SECRET) as any;
    const booking = await prismaClient.booking.findFirst({
      where: { eventId: eid, userId: decodedToken.userId },
    });

    if (booking) {
      socket.join(eid);
    } else {
      socket.emit("error", "You are not authorized to join this chat room");
    }
  });

  socket.on("chatMessage", async ({ eventId, message }) => {
    console.log("chatMessage", eventId, message);
    const decodedToken = jwt.verify(token as string, JWT_SECRET) as any;
    const user = await prismaClient.user.findFirst({
      where: { id: decodedToken.userId },
    });

    if (user) {
      const mge = await prismaClient.message.create({
        data: {
          content: message,
          chatRoom: { connect: { eventId } },
          user: { connect: { id: user.id } },
        },
        include: { user: true },
      });

      io.to(eventId).emit("message", mge);
    } else {
      socket.emit("error", "You are not authorized to join this chat room");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
