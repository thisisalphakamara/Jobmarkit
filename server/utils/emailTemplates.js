export const interviewScheduledTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000000;">Interview Scheduled</h2>
      <p>Dear ${data.applicantName || "Applicant"},</p>
      <p>Your interview has been scheduled for the position of ${
        data.jobTitle || "the position"
      }.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #000000; margin-top: 0;">Interview Details:</h3>
        <p><strong>Date:</strong> ${data.interviewDate}</p>
        <p><strong>Time:</strong> ${data.interviewTime}</p>
        <p><strong>Type:</strong> ${data.interviewType}</p>
        ${
          data.interviewType === "online"
            ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #000000; text-decoration: underline;">${data.meetingLink}</a></p>`
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
};

export const interviewCancelledTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000000;">Interview Cancelled</h2>
      <p>Dear ${data.applicantName || "Applicant"},</p>
      <p>Your interview for the position of ${
        data.jobTitle || "the position"
      } has been cancelled.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
      <p>We apologize for any inconvenience this may have caused.</p>
      <p>Best regards,<br>The Hiring Team</p>
    </div>
  `;
};

export const subscriptionConfirmationTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to the Jobmarkit Community!</h2>
      <p>Dear ${data.email},</p>
      <p>Thank you for subscribing to the Jobmarkit Community. We're excited to have you on board!</p>
      <p>You'll be the first to know about new job opportunities, features, and exclusive resources for Sierra Leone professionals.</p>
      <br>
      <p>Best regards,<br>Jobmarkit Team</p>
    </div>
  `;
};
