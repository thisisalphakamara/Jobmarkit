import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    province: { type: String, required: true },
    district: { type: String, required: true },
    town: { type: String, required: true },
  },
  mainCategory: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, required: true },
  salary: { type: Number, required: true },
  workType: { type: String, required: true },
  workSetup: { type: String, required: true },
  date: { type: Number, required: true },
  visible: { type: Boolean, default: true },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false,
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruiter",
    required: false,
  },

  // Translation fields
  originalLanguage: { type: String, enum: ["en", "krio"], default: "en" },
  titleKrio: { type: String },
  descriptionKrio: { type: String },
  titleEnglish: { type: String },
  descriptionEnglish: { type: String },

  // Auto-translation metadata
  translationStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  translationTimestamp: { type: Date },
  translationProvider: { type: String, default: "google" },
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
