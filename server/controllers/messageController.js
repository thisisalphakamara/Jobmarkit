import Message from "../models/Message.js";
import JobApplication from "../models/JobApplication.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

// Get messages for a specific application
const getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;

    console.log("=== DEBUG: getMessages ===");
    console.log("Application ID:", applicationId);
    console.log("req.company:", req.company);
    console.log("req.auth:", req.auth);
    console.log("Headers:", req.headers);

    // Verify the application exists
    const application = await JobApplication.findById(applicationId)
      .populate("userId", "name email")
      .populate("jobId", "title companyId")
      .populate("companyId", "name");

    if (!application) {
      console.log("Application not found:", applicationId);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    console.log("Found application:", application);

    // Get messages for this application
    const messages = await Message.find({
      applicationId: applicationId,
      deleted: false,
    }).sort({ createdAt: 1 });

    console.log("Found messages:", messages.length);

    // Format messages for frontend
    const formattedMessages = messages.map((message) => ({
      _id: message._id,
      content: message.content,
      sender: message.sender,
      senderId: message.senderId,
      recipientId: message.recipientId,
      timestamp: message.createdAt,
      read: message.read,
      type: message.type,
      templateId: message.templateId,
      attachments: message.attachments || [],
    }));

    console.log("Sending response with", formattedMessages.length, "messages");

    res.json({
      success: true,
      messages: formattedMessages,
      application: {
        id: application._id,
        applicantName: application.userId?.name,
        jobTitle: application.jobId?.title,
        companyName: application.companyId?.name,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const {
      recipientId,
      applicationId,
      content,
      type = "text",
      templateId = null,
    } = req.body;

    console.log("=== DEBUG: sendMessage ===");
    console.log("Request body:", {
      recipientId,
      applicationId,
      content,
      type,
      templateId,
    });

    // Validate required fields
    if (!recipientId || !applicationId || !content) {
      console.log("Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify the application exists
    const application = await JobApplication.findById(applicationId)
      .populate("userId", "name email")
      .populate("jobId", "title")
      .populate("companyId", "name");

    if (!application) {
      console.log("Application not found:", applicationId);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    console.log("Found application:", application);

    // Determine sender type based on the request
    let senderId, senderModel, sender, recipientModel;

    // Check if this is a company request (has company token) or user request
    const isCompanyRequest = req.headers.token && req.headers.token.length > 0;

    if (isCompanyRequest) {
      // Message from recruiter to applicant
      senderId = application.companyId._id;
      senderModel = "Company";
      sender = "recruiter";
      recipientModel = "User";
      console.log("Company sending message:", {
        senderId,
        senderModel,
        sender,
      });
    } else {
      // Message from applicant to recruiter
      senderId = application.userId._id;
      senderModel = "User";
      sender = "applicant";
      recipientModel = "Company";
      console.log("User sending message:", { senderId, senderModel, sender });
    }

    // Create the message
    const messageData = {
      sender: sender,
      senderId: senderId,
      senderModel: senderModel,
      recipientId: recipientId,
      recipientModel: recipientModel,
      applicationId: applicationId,
      content: content,
      type: type,
      templateId: templateId,
    };

    console.log("Creating message with data:", messageData);

    const message = new Message(messageData);

    console.log("Message object created:", message);

    await message.save();
    console.log("Message saved successfully");

    // Populate sender and recipient info
    try {
      if (message.senderModel === "Company") {
        await message.populate("senderId", "name email image");
      } else {
        await message.populate("senderId", "firstName lastName email image");
      }

      if (message.recipientModel === "Company") {
        await message.populate("recipientId", "name email image");
      } else {
        await message.populate("recipientId", "firstName lastName email image");
      }
    } catch (populateError) {
      console.log("Populate error (non-critical):", populateError);
    }

    // Format message for response
    const formattedMessage = {
      _id: message._id,
      content: message.content,
      sender: message.sender,
      senderId: message.senderId,
      recipientId: message.recipientId,
      timestamp: message.createdAt,
      read: message.read,
      type: message.type,
      templateId: message.templateId,
      attachments: message.attachments || [],
    };

    console.log("Sending response:", formattedMessage);

    res.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { token } = req.headers;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.read = true;
    message.readAt = new Date();
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

// Get unread message count for a user
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.headers;

    const count = await Message.countDocuments({
      recipientId: userId,
      recipientModel: "User",
      read: false,
      deleted: false,
    });

    res.json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { token } = req.headers;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Get company info from authenticated request
    const companyId = req.company._id;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Company not found",
      });
    }

    await message.softDelete(companyId, "Company");

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// Get message templates (for future use)
const getMessageTemplates = async (req, res) => {
  try {
    // This could be moved to a separate template model in the future
    const templates = [
      {
        id: "shortlisted",
        title: "Shortlisted for Interview",
        category: "Interview",
        template: `Dear {applicantName},

Congratulations! We are pleased to inform you that your application for the {jobTitle} position has been shortlisted for an interview.

Interview Details:
📅 Date: {interviewDate}
⏰ Time: {interviewTime}
📍 Location: {interviewLocation}
🔗 Meeting Link: {meetingLink}

Please confirm your attendance by replying to this message.

Best regards,
{companyName} Team`,
      },
      {
        id: "accepted",
        title: "Application Accepted",
        category: "Status Update",
        template: `Dear {applicantName},

We are delighted to inform you that your application for the {jobTitle} position has been accepted!

🎉 Welcome to the {companyName} team!

Next Steps:
1. We will send you the offer letter within 24 hours
2. Please review and sign the employment contract
3. Complete the onboarding process

Start Date: {startDate}
Location: {workLocation}

We look forward to having you on board!

Best regards,
{companyName} HR Team`,
      },
      {
        id: "rejected",
        title: "Application Status Update",
        category: "Status Update",
        template: `Dear {applicantName},

Thank you for your interest in the {jobTitle} position at {companyName}.

After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you took to apply and wish you the best in your future endeavors.

Best regards,
{companyName} Team`,
      },
    ];

    res.json({
      success: true,
      templates: templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
};

// Very simple test endpoint
const simpleTest = async (req, res) => {
  try {
    console.log("=== SIMPLE TEST ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);

    res.json({
      success: true,
      message: "Simple test working",
      receivedData: req.body,
    });
  } catch (error) {
    console.error("Simple test error:", error);
    res.status(500).json({
      success: false,
      message: "Simple test failed",
      error: error.message,
    });
  }
};

// Test endpoint to verify messaging works
const testMessage = async (req, res) => {
  try {
    console.log("=== TEST MESSAGE ENDPOINT ===");
    console.log("Request body:", req.body);
    console.log("req.company:", req.company);
    console.log("req.auth:", req.auth);

    res.json({
      success: true,
      message: "Test endpoint working",
      data: {
        company: req.company ? "Company authenticated" : "No company",
        auth: req.auth ? "User authenticated" : "No user auth",
        body: req.body,
      },
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
};

export {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  getMessageTemplates,
  simpleTest,
  testMessage,
};
