import express from "express";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: "Email required" });

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to the Jobmarkit Community!",
      template: "subscription-confirmation",
      data: { email },
    });
    res.json({ success: true, message: "Confirmation email sent!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

export default router;
