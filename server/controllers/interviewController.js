import Interview from "../models/Interview.js";
import JobApplication from "../models/JobApplication.js";
import { sendEmail } from "../utils/emailService.js";

// Schedule a new interview
export const scheduleInterview = async (req, res) => {
  try {
    const { applicationId, type, date, time, meetingLink, location } = req.body;

    // Debug logging
    console.log("Received request body:", req.body);
    console.log("Company from request:", req.company);

    // Validate required fields
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Interview type is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Interview date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        message: "Interview time is required",
      });
    }

    // Validate type-specific fields
    if (type === "online" && !meetingLink) {
      return res.status(400).json({
        success: false,
        message: "Meeting link is required for online interviews",
      });
    }

    if (type === "offline" && !location) {
      return res.status(400).json({
        success: false,
        message: "Location is required for in-person interviews",
      });
    }

    console.log("Looking for application with ID:", applicationId);

    // Check if application exists
    const application = await JobApplication.findById(applicationId)
      .populate("userId", "name email")
      .populate("jobId", "title companyId");

    console.log("Found application:", application);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify that the application belongs to the company
    console.log("Comparing company IDs:", {
      applicationCompanyId: application.companyId.toString(),
      requestCompanyId: req.company._id.toString(),
    });

    if (application.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to schedule interviews for this application",
      });
    }

    console.log("Creating new interview with details:", {
      applicationId,
      type,
      date: new Date(date),
      time,
      meetingLink: type === "online" ? meetingLink : undefined,
      location: type === "offline" ? location : undefined,
    });

    // Create new interview
    const interview = new Interview({
      applicationId,
      type,
      date: new Date(date),
      time,
      meetingLink: type === "online" ? meetingLink : undefined,
      location: type === "offline" ? location : undefined,
    });

    await interview.save();
    console.log("Interview saved successfully:", interview);

    // Update application with interview details
    application.interviewScheduled = true;
    application.interviewDate = new Date(date);
    application.interviewTime = time;
    application.interviewType = type;
    if (type === "online") {
      application.meetingLink = meetingLink;
    } else {
      application.interviewLocation = location;
    }

    console.log("Updating application with interview details:", application);
    await application.save();
    console.log("Application updated successfully");

    // Send email notification
    const emailData = {
      to: application.userId.email,
      subject: "Interview Scheduled",
      template: "interview-scheduled",
      data: {
        applicantName: application.userId.name,
        jobTitle: application.jobId.title,
        interviewType: type,
        interviewDate: new Date(date).toLocaleDateString(),
        interviewTime: time,
        ...(type === "online" ? { meetingLink } : { location }),
      },
    };

    console.log("Sending email notification:", emailData);
    await sendEmail(emailData);
    console.log("Email sent successfully");

    res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview,
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error scheduling interview",
      error: error.message,
      details: error.stack,
    });
  }
};

// Get all interviews for a company
export const getCompanyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate({
        path: "applicationId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "jobId", select: "title companyId" },
        ],
      })
      .sort({ date: 1, time: 1 });

    // Filter interviews for the current company
    const companyInterviews = interviews.filter(
      (interview) =>
        interview.applicationId?.jobId?.companyId?.toString() ===
        req.company._id.toString()
    );

    res.status(200).json({
      success: true,
      interviews: companyInterviews,
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interviews",
      error: error.message,
    });
  }
};

// Update interview status
export const updateInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status, notes } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    interview.status = status;
    if (notes) {
      interview.notes = notes;
    }

    await interview.save();

    res.status(200).json({
      success: true,
      message: "Interview status updated successfully",
      interview,
    });
  } catch (error) {
    console.error("Error updating interview status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating interview status",
      error: error.message,
    });
  }
};

// Cancel interview
export const cancelInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { reason } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    interview.status = "cancelled";
    interview.notes = reason;
    await interview.save();

    // Update application
    const application = await JobApplication.findById(interview.applicationId);
    if (application) {
      application.interviewScheduled = false;
      application.interviewDate = undefined;
      application.interviewTime = undefined;
      await application.save();
    }

    // Send cancellation email
    const emailData = {
      to: application.userId.email,
      subject: "Interview Cancelled",
      template: "interview-cancelled",
      data: {
        applicantName: application.userId.name,
        jobTitle: application.jobId.title,
        reason,
      },
    };

    await sendEmail(emailData);

    res.status(200).json({
      success: true,
      message: "Interview cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling interview:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling interview",
      error: error.message,
    });
  }
};
