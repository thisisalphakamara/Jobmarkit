import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["recruiter", "applicant"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderModel: {
      type: String,
      enum: ["Company", "User"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recipientModel: {
      type: String,
      enum: ["Company", "User"],
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApplication",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "file", "template"],
      default: "text",
    },
    templateId: {
      type: String,
      default: null,
    },
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        deletedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deletedByModel: {
      type: String,
      enum: ["Company", "User"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ applicationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ read: 1 });

// Virtual for message status
messageSchema.virtual("status").get(function () {
  if (this.deleted) return "deleted";
  if (this.read) return "read";
  return "unread";
});

// Method to mark as read
messageSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to soft delete
messageSchema.methods.softDelete = function (userId, userModel) {
  this.deleted = true;
  this.deletedBy.push({
    userId: userId,
    deletedAt: new Date(),
  });
  this.deletedByModel = userModel;
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function (
  applicationId,
  limit = 50,
  skip = 0
) {
  return this.find({
    applicationId: applicationId,
    deleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("senderId", "name email image")
    .populate("recipientId", "name email image");
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function (userId, userModel) {
  return this.countDocuments({
    recipientId: userId,
    recipientModel: userModel,
    read: false,
    deleted: false,
  });
};

export default mongoose.model("Message", messageSchema);
