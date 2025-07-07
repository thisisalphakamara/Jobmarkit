import express from "express";
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  getMessageTemplates,
  simpleTest,
  testMessage,
} from "../controllers/messageController.js";

const router = express.Router();

// Very simple test endpoint
router.post("/simple-test", simpleTest);

// Test endpoint
router.post("/test", testMessage);

// Get messages for a specific application
router.get("/:applicationId", getMessages);

// Send a new message
router.post("/send", sendMessage);

// Mark message as read
router.put("/:messageId/read", markAsRead);

// Get unread message count for a user
router.get("/unread/:userId", getUnreadCount);

// Delete a message (soft delete)
router.delete("/:messageId", deleteMessage);

// Get message templates
router.get("/templates/all", getMessageTemplates);

export default router;
