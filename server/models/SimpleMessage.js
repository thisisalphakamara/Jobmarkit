import mongoose from "mongoose";

const simpleMessageSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApplication",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["recruiter", "applicant"],
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    audioUrl: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
simpleMessageSchema.index({ applicationId: 1, createdAt: -1 });

export default mongoose.model("SimpleMessage", simpleMessageSchema);
