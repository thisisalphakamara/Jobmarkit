import SimpleMessage from "../models/SimpleMessage.js";
import JobApplication from "../models/JobApplication.js";
import cloudinary from "../config/cloudinary.js";

// Socket.IO instance (will be set from server.js)
let io = null;

// Function to set Socket.IO instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Get messages for an application
export const getSimpleMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;

    console.log("Getting messages for application:", applicationId);

    // Verify application exists
    const application = await JobApplication.findById(applicationId)
      .populate("userId", "firstName lastName")
      .populate("companyId", "name")
      .populate("jobId", "title");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get messages
    const messages = await SimpleMessage.find({ applicationId }).sort({
      createdAt: 1,
    });

    console.log("Found messages:", messages.length);

    // Format messages to include timestamp field
    const formattedMessages = messages.map((message) => ({
      _id: message._id,
      applicationId: message.applicationId,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      audioUrl: message.audioUrl,
      read: message.read,
      timestamp: message.createdAt, // Explicitly include timestamp field
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      application: {
        id: application._id,
        applicantName: `${application.userId?.firstName || ""} ${
          application.userId?.lastName || ""
        }`.trim(),
        jobTitle: application.jobId?.title || "Position",
        companyName: application.companyId?.name || "Company",
      },
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// Send a simple message
export const sendSimpleMessage = async (req, res) => {
  try {
    const { applicationId, senderType, senderId, senderName, content } =
      req.body;

    console.log("Sending message:", {
      applicationId,
      senderType,
      senderId,
      senderName,
      content,
    });

    // Validate required fields
    if (!applicationId || !senderType || !senderId || !senderName || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify application exists
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Create message
    const message = new SimpleMessage({
      applicationId,
      senderType,
      senderId,
      senderName,
      content,
    });

    await message.save();
    console.log("Message saved successfully");

    // Create formatted message for response
    const formattedMessage = {
      _id: message._id,
      applicationId: message.applicationId,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      read: message.read,
      timestamp: message.createdAt,
    };

    // Emit real-time event if Socket.IO is available
    if (io) {
      io.to(`chat-${applicationId}`).emit("message-received", formattedMessage);
      console.log(`Emitted message-received event to chat-${applicationId}`);
    }

    res.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Mark message as read
export const markSimpleMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await SimpleMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.read = true;
    await message.save();

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

// Send a voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const { applicationId, senderType, senderId, senderName } = req.body;
    const audioFile = req.file;

    console.log("Sending voice message:", {
      applicationId,
      senderType,
      senderId,
      senderName,
      hasAudioFile: !!audioFile,
      audioFileDetails: audioFile
        ? {
            filename: audioFile.filename,
            mimetype: audioFile.mimetype,
            size: audioFile.size,
            path: audioFile.path,
          }
        : null,
    });

    // Validate required fields
    if (
      !applicationId ||
      !senderType ||
      !senderId ||
      !senderName ||
      !audioFile
    ) {
      console.error("Missing required fields:", {
        applicationId,
        senderType,
        senderId,
        senderName,
        hasAudioFile: !!audioFile,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields or audio file",
      });
    }

    // Verify application exists
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      console.error("Application not found:", applicationId);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Upload audio file to Cloudinary
    let audioUrl = "";

    // Check if Cloudinary is configured
    const cloudinaryConfig = cloudinary.config();
    console.log("Cloudinary config check:", {
      hasCloudName: !!cloudinaryConfig.cloud_name,
      hasApiKey: !!cloudinaryConfig.api_key,
      hasApiSecret: !!cloudinaryConfig.api_secret,
    });

    try {
      console.log("Uploading to Cloudinary:", audioFile.path);
      const result = await cloudinary.uploader.upload(audioFile.path, {
        resource_type: "video", // Cloudinary treats audio as video
        folder: "voice-messages",
        format: "webm",
      });
      audioUrl = result.secure_url;
      console.log("Cloudinary upload successful:", audioUrl);
    } catch (uploadError) {
      console.error("Error uploading audio to Cloudinary:", uploadError);

      // Fallback: Store file locally and serve via static route
      try {
        const fileName = `voice-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.webm`;
        const fs = await import("fs");
        const path = await import("path");

        // Copy file to a public directory
        const publicDir = path.join(process.cwd(), "public", "voice-messages");
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        const destPath = path.join(publicDir, fileName);
        fs.copyFileSync(audioFile.path, destPath);

        // Create a local URL
        audioUrl = `/voice-messages/${fileName}`;
        console.log("Fallback storage successful:", audioUrl);
      } catch (fallbackError) {
        console.error("Fallback storage also failed:", fallbackError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload audio file",
          error: "Both Cloudinary and local storage failed",
        });
      }
    }

    // Create voice message
    const message = new SimpleMessage({
      applicationId,
      senderType,
      senderId,
      senderName,
      content: "🎤 Voice Message", // Placeholder text for voice messages
      audioUrl, // Store the audio URL
    });

    await message.save();
    console.log("Voice message saved successfully");

    // Create formatted message for response
    const formattedMessage = {
      _id: message._id,
      applicationId: message.applicationId,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      audioUrl: message.audioUrl,
      read: message.read,
      timestamp: message.createdAt,
    };

    // Emit real-time event if Socket.IO is available
    if (io) {
      io.to(`chat-${applicationId}`).emit("message-received", formattedMessage);
      console.log(
        `Emitted voice message-received event to chat-${applicationId}`
      );
    }

    res.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Error sending voice message:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to send voice message",
      error: error.message,
    });
  }
};
