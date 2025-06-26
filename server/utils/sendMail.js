import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jobmarkitsl@gmail.com",
    pass: "oavg holo pfhf odkp", // <-- no spaces
  },
});

const sendMail = async (to, subject, text, replyTo = null) => {
  const mailOptions = {
    from: '"Jobmarkit" <jobmarkitsl@gmail.com>',
    to,
    subject,
    text,
  };
  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};

export default sendMail;
