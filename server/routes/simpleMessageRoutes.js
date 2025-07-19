import express from "express";
import multer from "multer";
import {
  getSimpleMessages,
  sendSimpleMessage,
  markSimpleMessageAsRead,
  sendVoiceMessage,
} from "../controllers/simpleMessageController.js";

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "voice-" + uniqueSuffix + ".webm");
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Get messages for an application
router.get("/:applicationId", getSimpleMessages);

// Send a message
router.post("/send", sendSimpleMessage);

// Test endpoint for voice message
router.get("/test/voice", (req, res) => {
  res.json({
    success: true,
    message: "Voice message endpoint is working",
    timestamp: new Date().toISOString(),
  });
});

// Send a voice message
router.post("/send-voice", upload.single("audio"), sendVoiceMessage);

// Mark message as read
router.put("/:messageId/read", markSimpleMessageAsRead);

export default router;
