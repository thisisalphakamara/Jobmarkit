import React, { useContext, useEffect, useState, useRef } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import Loading from "../components/Loading";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  FileText,
  ChevronDown,
  User,
  MapPin,
  Briefcase,
  MoreHorizontal,
  Search,
  Calendar,
  Video,
  Map,
} from "lucide-react";

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [interviewType, setInterviewType] = useState("online");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const menuRef = useRef(null);

  const fetchCompanyJobApplications = async () => {
    try {
      setLoading(true);
      console.log("Fetching applications with token:", companyToken);

      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: { token: companyToken },
      });

      console.log("Received applications data:", data);

      if (data.success) {
        // Debug log each application's structure
        data.applications.forEach((app, index) => {
          console.log(`Application ${index + 1}:`, {
            id: app._id,
            userId: app.userId,
            jobId: app.jobId,
            status: app.status,
          });
        });

        // Ensure each application has the required fields
        const validApplications = data.applications.filter((app) => {
          const isValid = app && app._id && app.userId && app.jobId;
          if (!isValid) {
            console.warn("Invalid application data:", app);
          }
          return isValid;
        });

        console.log("Valid applications:", validApplications);
        setApplicants(validApplications.reverse());
      } else {
        console.error("Failed to fetch applications:", data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeJobApplicationStatus = async (id, status, applicant) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-status`,
        { id, status }, // status: "Accepted" or "Rejected"
        { headers: { token: companyToken } }
      );

      if (data.success) {
        // Send email notification if applicant email is available
        let applicantEmail = "";
        let applicantName = "";
        if (typeof applicant.userId === "object") {
          applicantEmail = applicant.userId.email || "";
          applicantName = applicant.userId.name || "";
        }
        if (applicantEmail) {
          try {
            await axios.post(`${backendUrl}/api/application/status`, {
              applicantEmail,
              applicantName,
              jobTitle: applicant.jobId?.title || "",
              status: status.toLowerCase(), // "accepted" or "rejected"
            });
          } catch (emailErr) {
            toast.error("Status updated, but failed to send email.");
          }
        }
        fetchCompanyJobApplications();
        toast.success(`Application ${status.toLowerCase()} successfully`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const scheduleInterview = async () => {
    try {
      if (!companyToken) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      if (!selectedApplicant) {
        toast.error("No applicant selected");
        return;
      }

      // Debug logging for selected applicant
      console.log("Selected Applicant Full Data:", selectedApplicant);
      console.log("Selected Applicant ID:", selectedApplicant._id);
      console.log("Selected Applicant User:", selectedApplicant.userId);
      console.log("Selected Applicant Job:", selectedApplicant.jobId);

      // Validate required fields
      if (!interviewDate || !interviewTime) {
        toast.error("Please select both date and time for the interview");
        return;
      }

      if (interviewType === "online" && !meetingLink) {
        toast.error("Please provide a meeting link for online interview");
        return;
      }

      if (interviewType === "offline" && !interviewLocation) {
        toast.error("Please provide a location for in-person interview");
        return;
      }

      // Format the date and time
      const formattedDate = new Date(interviewDate).toISOString();
      const formattedTime = interviewTime;

      // Ensure we have the correct application ID
      const applicationId = selectedApplicant._id;
      if (!applicationId) {
        console.error(
          "No application ID found in selected applicant:",
          selectedApplicant
        );
        toast.error("Invalid application data");
        return;
      }

      const interviewDetails = {
        applicationId,
        type: interviewType,
        date: formattedDate,
        time: formattedTime,
        ...(interviewType === "online"
          ? { meetingLink }
          : { location: interviewLocation }),
      };

      // Debug logging
      console.log("Sending interview request with details:", interviewDetails);

      const { data } = await axios.post(
        `${backendUrl}/api/company/schedule-interview`,
        interviewDetails,
        {
          headers: {
            token: companyToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (data.success) {
        toast.success("Interview scheduled successfully");
        setShowSchedulingModal(false);
        resetSchedulingForm();
        fetchCompanyJobApplications();
      } else {
        console.error("Server response:", data);
        toast.error(data.message || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error details:", error.response?.data?.details);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error scheduling interview";

      toast.error(errorMessage);
    }
  };

  const resetSchedulingForm = () => {
    setSelectedApplicant(null);
    setInterviewType("online");
    setInterviewDate("");
    setInterviewTime("");
    setMeetingLink("");
    setInterviewLocation("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications();
    }
  }, [companyToken]);

  // Filter applicants based on search term and status filter
  const filteredApplicants = applicants
    .filter((item) => item.jobId && item.userId)
    .filter((applicant) => {
      const matchesSearch =
        searchTerm === "" ||
        (applicant.userId?.name &&
          applicant.userId.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.title &&
          applicant.jobId.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.location &&
          applicant.jobId.location
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && applicant.status === "pending") ||
        (filterStatus === "accepted" && applicant.status === "Accepted") ||
        (filterStatus === "rejected" && applicant.status === "Rejected");

      return matchesSearch && matchesStatus;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Accepted":
        return (
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-full text-sm font-medium">
            <Check size={14} />
            <span>Accepted</span>
          </div>
        );
      case "Rejected":
        return (
          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-full text-sm font-medium">
            <X size={14} />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-full text-sm font-medium">
            <ChevronDown size={14} />
            <span>Pending</span>
          </div>
        );
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Application Management
          </h1>
          <p className="text-gray-500">
            Review and manage candidate applications
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          {/* Filters and Search */}
          <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[250px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applicants..."
                className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "pending"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus("accepted")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "accepted"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => setFilterStatus("rejected")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "rejected"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    #
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>Applicant</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold max-md:hidden">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} />
                      <span>Job Position</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold max-md:hidden">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>Location</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span>Resume</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Schedule Interview</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="flex flex-col items-center justify-center py-16">
                        <img
                          src={
                            assets.default_company_icon || "/empty-state.svg"
                          }
                          alt="No applications"
                          className="w-20 h-20 mb-4 opacity-30"
                        />
                        <h3 className="text-lg font-medium text-gray-700 mb-1">
                          No applications found
                        </h3>
                        <p className="text-gray-500 text-center mb-2">
                          No matching applications with the current filters
                        </p>
                        {(searchTerm || filterStatus !== "all") && (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setFilterStatus("all");
                            }}
                            className="mt-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant, index) => (
                    <motion.tr
                      key={applicant._id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="py-4 px-5 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {applicant.userId?.image ? (
                              <img
                                className="w-full h-full object-cover"
                                src={applicant.userId.image}
                                alt={`${
                                  applicant.userId.name || "Applicant"
                                }'s avatar`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = assets.default_avatar;
                                }}
                              />
                            ) : (
                              <img
                                className="w-full h-full object-cover"
                                src={assets.default_avatar}
                                alt="Default avatar"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {applicant.userId?.name || "Unknown"}
                            </div>
                            <div className="text-gray-500 text-sm md:hidden">
                              {applicant.jobId?.title || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-700 max-md:hidden">
                        {applicant.jobId?.title || "N/A"}
                      </td>
                      <td className="py-4 px-5 text-gray-700 max-md:hidden">
                        {applicant.jobId?.location || "Remote"}
                      </td>
                      <td className="py-4 px-5">
                        {typeof applicant.userId === "object" &&
                        applicant.userId?.resume ? (
                          <a
                            href={applicant.userId.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            <FileText size={16} />
                            View Resume
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No Resume
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {applicant.status === "pending" && (
                          <button
                            onClick={() => {
                              console.log(
                                "Setting selected applicant:",
                                applicant
                              );
                              setSelectedApplicant(applicant);
                              setShowSchedulingModal(true);
                            }}
                            className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            <Calendar size={16} />
                            Schedule
                          </button>
                        )}
                        {applicant.interviewScheduled && (
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">
                              {new Date(
                                applicant.interviewDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-gray-500">
                              {applicant.interviewTime}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 relative">
                        {applicant.status &&
                        applicant.status.toLowerCase().trim() === "pending" ? (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === index ? null : index
                                )
                              }
                              className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                            >
                              <span>Pending</span>
                              <MoreHorizontal size={16} />
                            </button>
                            <AnimatePresence>
                              {activeDropdown === index && (
                                <motion.div
                                  ref={menuRef}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute right-0 top-full mt-1 z-10 w-36 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden"
                                >
                                  <button
                                    onClick={() => {
                                      changeJobApplicationStatus(
                                        applicant._id,
                                        "Accepted",
                                        applicant
                                      );
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Check size={16} />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      changeJobApplicationStatus(
                                        applicant._id,
                                        "Rejected",
                                        applicant
                                      );
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <X size={16} />
                                    Reject
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          getStatusBadge(applicant.status)
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Add Interview Scheduling Modal */}
      <AnimatePresence>
        {showSchedulingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setInterviewType("online")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        interviewType === "online"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Video size={16} />
                      Online
                    </button>
                    <button
                      onClick={() => setInterviewType("offline")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        interviewType === "offline"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Map size={16} />
                      In-person
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-300"
                    />
                  </div>
                </div>

                {interviewType === "online" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Link
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Zoom/Google Meet link"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-300"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Enter interview location"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-300"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSchedulingModal(false);
                      resetSchedulingForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={scheduleInterview}
                    className="px-4 py-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    Schedule Interview
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApplications;
