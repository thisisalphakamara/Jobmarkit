import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Company",
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Recruiter",
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Job",
    },
    status: { type: String, required: true, default: "pending" },
    date: { type: Number, required: true },
    // Interview related fields
    interviewScheduled: { type: Boolean, default: false },
    interviewDate: { type: Date },
    interviewTime: { type: String },
    interviewType: { type: String, enum: ["online", "offline"] },
    meetingLink: { type: String },
    interviewLocation: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add a virtual populate for user data
JobApplicationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

const JobApplication = mongoose.model("JobApplication", JobApplicationSchema);

export default JobApplication;
