import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // ... existing fields ...

    // Interview related fields
    interviewScheduled: {
      type: Boolean,
      default: false,
    },
    interviewDate: {
      type: Date,
    },
    interviewTime: {
      type: String,
    },
    interviewType: {
      type: String,
      enum: ["online", "offline"],
    },
    meetingLink: {
      type: String,
    },
    interviewLocation: {
      type: String,
    },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);
export default Application;
