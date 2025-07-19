import express from "express";
import sendMail from "../utils/sendMail.js";
import JobApplication from "../models/JobApplication.js";
const router = express.Router();

// When a user applies for a job
router.post("/apply", async (req, res) => {
  const { applicantEmail, jobPosterEmail, jobTitle } = req.body;
  // ...save application logic...

  try {
    // Send confirmation to applicant (replyTo: job poster)
    await sendMail(
      applicantEmail,
      "Application Received",
      `Your application for "${jobTitle}" has been received. The employer will contact you soon.`,
      jobPosterEmail
    );

    // Notify job poster (replyTo: applicant)
    await sendMail(
      jobPosterEmail,
      "New Application Received",
      `Someone applied to your job posting: "${jobTitle}". Applicant email: ${applicantEmail}`,
      applicantEmail
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// When status changes
router.post("/status", async (req, res) => {
  const { applicantEmail, jobTitle, status } = req.body;
  let subject, text;
  if (status === "accepted") {
    subject = "Application Accepted";
    text = `Congratulations! You have been accepted for "${jobTitle}".`;
  } else if (status === "rejected") {
    subject = "Application Update";
    text = `We regret to inform you that you were not selected for "${jobTitle}".`;
  }
  try {
    await sendMail(applicantEmail, subject, text);
    res.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err); // <-- Add this line
    return res
      .status(200)
      .json({ message: "Status updated, but failed to send email." });
  }
});

// Add this to your application.js for testing
router.get("/test-email", async (req, res) => {
  try {
    await sendMail(
      "your@email.com", // <-- replace with your real email to test
      "Test Email",
      "This is a test email from Jobmarkit."
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// When an interview is scheduled
router.post("/interview", async (req, res) => {
  const { applicantEmail, jobTitle, interviewDetails } = req.body;
  const { type, date, time, location } = interviewDetails;
  let details =
    `You are invited to an interview for "${jobTitle}".\n\n` +
    `Type: ${type === "online" ? "Online" : "On Site"}\n` +
    `Date: ${date}\nTime: ${time}\n` +
    (type === "online"
      ? `Meeting Link: ${location}`
      : `Location: ${location}`) +
    `\n\nPlease confirm your attendance.`;

  try {
    await sendMail(
      applicantEmail,
      `Interview Invitation for "${jobTitle}"`,
      details
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an application
router.delete("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await JobApplication.findByIdAndDelete(id);
    if (!deleted) {
      return res.json({ success: false, message: "Application not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;
