//import './config/instrument.js'
import express from "express";
import cors from "cors";
import "dotenv/config"; // For ES Modules
// or, if using CommonJS:
// require('dotenv').config();
import connectDB from "./config/db.js";
//import * as Sentry from "@sentry/node";
import { clerkWebhooks } from "./controller/webhooks.js";
import companyRoutes from "./routes/companyRoutes.js";
import JobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import applicationRoutes from "./routes/application.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import simpleMessageRoutes from "./routes/simpleMessageRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import { protectCompany, protectUser } from "./middleware/authMiddleware.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setSocketIO } from "./controllers/simpleMessageController.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";

// Initialize Express
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set Socket.IO instance in the controller
setSocketIO(io);

// Connect to MongoDB
await connectDB();
// Cloudinary is now initialized in the config file, no need to call connectCloudinary()

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Serve static files for voice messages
app.use("/voice-messages", express.static("public/voice-messages"));

// Routes
app.get("/", (req, res) => res.send("API Working"));

//Sentry.setupExpressErrorHandler(app);

//app.get("/debug-sentry", function mainHandler(req, res) {
//throw new Error("My first Sentry error!");
//});
app.post("/webhooks", clerkWebhooks);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", JobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/application", applicationRoutes);
app.use("/", applicationRoutes);
app.use("/api/company", interviewRoutes);
app.use("/api/messages", protectCompany, messageRoutes);
app.use("/api/user-messages", protectUser, messageRoutes);
app.use("/api/subscribe", subscribeRoutes);

// Simple test messaging route without authentication
app.use("/api/simple-messages", messageRoutes);

// New simple messaging system - no authentication required
app.use("/api/simple-chat", simpleMessageRoutes);

// Translation routes - no authentication required
app.use("/api/translate", translateRoutes);

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a chat room for a specific application
  socket.on("join-chat", (applicationId) => {
    socket.join(`chat-${applicationId}`);
    console.log(`User ${socket.id} joined chat room: chat-${applicationId}`);
  });

  // Leave a chat room
  socket.on("leave-chat", (applicationId) => {
    socket.leave(`chat-${applicationId}`);
    console.log(`User ${socket.id} left chat room: chat-${applicationId}`);
  });

  // Handle new message
  socket.on("new-message", (messageData) => {
    console.log("New message received:", messageData);

    // Broadcast the message to all users in the chat room
    socket
      .to(`chat-${messageData.applicationId}`)
      .emit("message-received", messageData);

    // Also emit to the sender for confirmation
    socket.emit("message-sent", messageData);
  });

  // Handle typing indicators
  socket.on("typing-start", (data) => {
    socket.to(`chat-${data.applicationId}`).emit("user-typing", {
      applicationId: data.applicationId,
      senderType: data.senderType,
      senderName: data.senderName,
    });
  });

  socket.on("typing-stop", (data) => {
    socket.to(`chat-${data.applicationId}`).emit("user-stopped-typing", {
      applicationId: data.applicationId,
      senderType: data.senderType,
    });
  });

  // Handle message read status
  socket.on("message-read", (data) => {
    socket.to(`chat-${data.applicationId}`).emit("message-marked-read", {
      messageId: data.messageId,
      applicationId: data.applicationId,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
