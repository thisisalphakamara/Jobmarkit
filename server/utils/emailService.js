import nodemailer from "nodemailer";
import {
  interviewScheduledTemplate,
  interviewCancelledTemplate,
  subscriptionConfirmationTemplate,
} from "./emailTemplates.js";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jobmarkitsl@gmail.com",
    pass: "oavg holo pfhf odkp", // App password for Gmail
  },
});

// Function to send emails
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    let htmlContent;

    // Select the appropriate template
    switch (template) {
      case "interview-scheduled":
        htmlContent = interviewScheduledTemplate(data);
        break;
      case "interview-cancelled":
        htmlContent = interviewCancelledTemplate(data);
        break;
      case "subscription-confirmation":
        htmlContent = subscriptionConfirmationTemplate(data);
        break;
      default:
        throw new Error("Invalid email template");
    }

    // Send the email
    const info = await transporter.sendMail({
      from: '"Jobmarkit" <jobmarkitsl@gmail.com>',
      to,
      subject,
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Get email template based on type
const getEmailTemplate = (template, data) => {
  switch (template) {
    case "interview-scheduled":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Interview Scheduled</h2>
          <p>Dear ${data.applicantName},</p>
          <p>Your interview has been scheduled for the position of ${
            data.jobTitle
          }.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Interview Details:</h3>
            <p><strong>Date:</strong> ${data.interviewDate}</p>
            <p><strong>Time:</strong> ${data.interviewTime}</p>
            <p><strong>Type:</strong> ${data.interviewType}</p>
            ${
              data.interviewType === "online"
                ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>`
                : `<p><strong>Location:</strong> ${data.location}</p>`
            }
          </div>
          <p>Please make sure to:</p>
          <ul>
            <li>Arrive 5-10 minutes early</li>
            <li>Bring a copy of your resume</li>
            <li>${
              data.interviewType === "online"
                ? "Test your audio and video before the interview"
                : "Dress professionally"
            }</li>
          </ul>
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <p>Best regards,<br>The Hiring Team</p>
        </div>
      `;
    case "interview-cancelled":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Interview Cancelled</h2>
          <p>Dear ${data.applicantName},</p>
          <p>Your interview for the position of ${
            data.jobTitle
          } has been cancelled.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
          <p>We apologize for any inconvenience this may have caused.</p>
          <p>Best regards,<br>The Hiring Team</p>
        </div>
      `;
    case "application-status":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Status Update</h2>
          <p>Dear ${data.applicantName},</p>
          <p>Your application for the position of ${data.jobTitle} has been ${
        data.status
      }.</p>
          ${
            data.status === "accepted"
              ? `<p>Congratulations! We are excited to move forward with your application.</p>`
              : `<p>Thank you for your interest in the position. We encourage you to apply for other positions that match your skills and experience.</p>`
          }
          <p>Best regards,<br>The Hiring Team</p>
        </div>
      `;
    default:
      return "";
  }
};

export { sendEmail };
