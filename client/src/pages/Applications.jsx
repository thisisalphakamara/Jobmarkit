import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import moment from "moment";
import Footer from "../components/Footer";
import { AppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import VoiceRecorder from "../components/VoiceRecorder";
import {
  FileText,
  File,
  Edit,
  Download,
  Briefcase,
  Trash2,
  MessageSquare,
  Send,
  X,
  User,
  Building,
  Play,
  Pause,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { FiFilter, FiX } from "react-icons/fi";

const Applications = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { socket, isConnected, joinChat, leaveChat, startTyping, stopTyping } =
    useSocket();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);
  const [userApplicationsState, setUserApplicationsState] = useState([]);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    company: "",
    jobTitle: "",
    dateApplied: "all",
    jobType: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const context = useContext(AppContext);
  const {
    backendUrl,
    userData,
    userApplications,
    fetchUserData,
    totalUnreadCount,
    setTotalUnreadCount,
  } = context;

  useEffect(() => {
    setUserApplicationsState(userApplications || []);
  }, [userApplications]);

  // Apply filters to applications
  useEffect(() => {
    const applyFilters = () => {
      let filtered = userApplicationsState;

      // Filter by status
      if (filters.status !== "all") {
        filtered = filtered.filter(
          (app) => app.status?.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // Filter by company name
      if (filters.company) {
        filtered = filtered.filter((app) => {
          const companyName = getCompanyName(app.jobId).toLowerCase();
          return companyName.includes(filters.company.toLowerCase());
        });
      }

      // Filter by job title
      if (filters.jobTitle) {
        filtered = filtered.filter((app) => {
          const title = app.jobId?.title?.toLowerCase() || "";
          return title.includes(filters.jobTitle.toLowerCase());
        });
      }

      // Filter by job type
      if (filters.jobType !== "all") {
        filtered = filtered.filter((app) => {
          const jobType = getJobType(app).toLowerCase();
          return jobType === filters.jobType.toLowerCase();
        });
      }

      // Filter by date applied
      if (filters.dateApplied !== "all") {
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        filtered = filtered.filter((app) => {
          const appliedDate = new Date(app.createdAt);
          switch (filters.dateApplied) {
            case "today":
              return appliedDate >= oneDayAgo;
            case "week":
              return appliedDate >= sevenDaysAgo;
            case "month":
              return appliedDate >= thirtyDaysAgo;
            default:
              return true;
          }
        });
      }

      setFilteredApplications(filtered);
    };

    applyFilters();
  }, [userApplicationsState, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "all",
      company: "",
      jobTitle: "",
      dateApplied: "all",
      jobType: "all",
    });
  };

  // Get unique job types for filter dropdown
  const getUniqueJobTypes = () => {
    return ["Full-time", "Part-time", "Contract", "Internship"];
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.company) count++;
    if (filters.jobTitle) count++;
    if (filters.dateApplied !== "all") count++;
    if (filters.jobType !== "all") count++;
    return count;
  };

  // Handle Escape key to close messaging modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && showMessagingModal) {
        setShowMessagingModal(false);
        setSelectedApplication(null);
        setMessages([]);
        setActiveChatId(null); // Clear active chat ID
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showMessagingModal]);

  // Mark messages as read when user is actively viewing the chat
  const markMessagesAsRead = async (applicationId) => {
    if (!showMessagingModal || !applicationId) return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/simple-chat/${applicationId}`
      );
      if (data.success) {
        const unreadMessages = data.messages.filter(
          (msg) => msg.senderType === "recruiter" && !msg.read
        );

        // Mark each unread message as read
        for (const message of unreadMessages) {
          await axios.put(`${backendUrl}/api/simple-chat/${message._id}/read`);
        }

        // Update unread counts
        setUnreadCounts((prev) => ({
          ...prev,
          [applicationId]: 0,
        }));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Socket.IO event listeners for real-time messaging
  useEffect(() => {
    if (!socket || !selectedApplication?._id) return;

    // Join the chat room when modal opens
    joinChat(selectedApplication._id);

    // Listen for new messages
    const handleMessageReceived = (message) => {
      console.log("Real-time message received (Applications):", message);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some((m) => m._id === message._id);
        if (exists) {
          console.log("Message already exists, skipping duplicate");
          return prev;
        }
        console.log("Adding new message to state");
        return [...prev, message];
      });

      // Only update unread counts if message is from recruiter AND modal is not open
      if (
        message.senderType === "recruiter" &&
        activeChatId !== selectedApplication._id
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedApplication._id]: (prev[selectedApplication._id] || 0) + 1,
        }));
        // Show toast notification for new message if not actively viewing
        toast.info("New message from recruiter!");
      } else if (
        message.senderType === "recruiter" &&
        activeChatId === selectedApplication._id
      ) {
        // If this chat is actively being viewed, mark the message as read immediately
        markMessagesAsRead(selectedApplication._id);
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.senderType !== "applicant") {
        setTypingUsers((prev) => {
          const filtered = prev.filter(
            (user) => user.senderType !== data.senderType
          );
          return [
            ...filtered,
            { senderType: data.senderType, senderName: data.senderName },
          ];
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.senderType !== "applicant") {
        setTypingUsers((prev) =>
          prev.filter((user) => user.senderType !== data.senderType)
        );
      }
    };

    // Listen for message read status
    const handleMessageRead = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, read: true } : msg
        )
      );
    };

    // Add event listeners
    socket.on("message-received", handleMessageReceived);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stopped-typing", handleUserStoppedTyping);
    socket.on("message-marked-read", handleMessageRead);

    // Cleanup function
    return () => {
      leaveChat(selectedApplication._id);
      socket.off("message-received", handleMessageReceived);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
      socket.off("message-marked-read", handleMessageRead);
    };
  }, [
    socket,
    selectedApplication?._id,
    joinChat,
    leaveChat,
    showMessagingModal,
    activeChatId,
  ]);

  // Add this global useEffect after your other useEffects, outside the one that depends on selectedApplication
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      // Only show notification if message is from recruiter
      if (message.senderType === "recruiter") {
        // If the chat modal is not open for this application, show a toast
        if (
          !showMessagingModal ||
          !selectedApplication ||
          selectedApplication._id !== message.applicationId
        ) {
          toast.info("New message from recruiter!");
          setUnreadCounts((prev) => ({
            ...prev,
            [message.applicationId]: (prev[message.applicationId] || 0) + 1,
          }));
        }
      }
    };

    socket.on("message-received", handleMessageReceived);

    return () => {
      socket.off("message-received", handleMessageReceived);
    };
  }, [socket, showMessagingModal, selectedApplication]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!selectedApplication?._id) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    startTyping({
      applicationId: selectedApplication._id,
      senderType: "applicant",
      senderName:
        `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
        "Applicant",
    });

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping({
        applicationId: selectedApplication._id,
        senderType: "applicant",
        senderName:
          `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
          "Applicant",
      });
    }, 2000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Voice recording functions
  const handleSendVoiceMessage = async (audioBlob) => {
    if (!audioBlob || !selectedApplication?._id) return;

    try {
      setSending(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      formData.append("applicationId", selectedApplication._id);
      formData.append("senderType", "applicant");
      formData.append("senderId", user?.id || "user");
      formData.append(
        "senderName",
        `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
          "Applicant"
      );

      console.log("Sending voice message with data:", {
        applicationId: selectedApplication._id,
        senderType: "applicant",
        senderId: user?.id || "user",
        senderName:
          `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
          "Applicant",
        audioBlobSize: audioBlob.size,
        audioBlobType: audioBlob.type,
      });

      const { data } = await axios.post(
        `${backendUrl}/api/simple-chat/send-voice`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        // Don't add message to local state here - let Socket.IO handle it
        // But add a fallback in case Socket.IO fails
        if (!isConnected) {
          console.log("Socket.IO not connected, adding voice message directly");
          setMessages((prev) => [...prev, data.message]);
        } else {
          // Add a timeout fallback in case Socket.IO event is delayed
          setTimeout(() => {
            setMessages((prev) => {
              const exists = prev.some((m) => m._id === data.message._id);
              if (!exists) {
                console.log(
                  "Socket.IO event delayed, adding voice message as fallback"
                );
                return [...prev, data.message];
              }
              return prev;
            });
          }, 2000); // 2 second timeout
        }

        toast.success("Voice message sent successfully");
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      console.error("Error response:", error.response?.data);

      // Show more specific error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to send voice message";
      toast.error(`Voice message error: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handlePlayVoiceMessage = (audioUrl, messageId) => {
    if (audioRef.current) {
      if (playingMessageId === messageId && !audioRef.current.paused) {
        // Stop current playback
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingVoice(false);
        setPlayingMessageId(null);
      } else {
        // Start new playback
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlayingVoice(true);
        setPlayingMessageId(messageId);
      }
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlayingVoice(false);
    setPlayingMessageId(null);
  };

  // Check for unread messages periodically
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (userApplicationsState.length > 0) {
        const counts = {};
        for (const application of userApplicationsState) {
          try {
            const { data } = await axios.get(
              `${backendUrl}/api/simple-chat/${application._id}`
            );
            if (data.success) {
              const unreadCount = data.messages.filter(
                (msg) => msg.senderType === "recruiter" && !msg.read
              ).length;
              counts[application._id] = unreadCount;
            }
          } catch (error) {
            console.error("Error checking unread messages:", error);
          }
        }
        setUnreadCounts(counts);
      }
    };

    checkUnreadMessages();
    // Check every 30 seconds for new messages
    const interval = setInterval(checkUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [userApplicationsState, backendUrl]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (showMessagingModal && messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      });
    }
  }, [messages, showMessagingModal]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  const updateResume = async () => {
    try {
      if (!resume) {
        toast.error("Please select a resume file.");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();

      const { data } = await axios.post(
        `${backendUrl}/api/users/update-resume`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        await fetchUserData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update resume. Please try again.");
    }

    setIsEdit(false);
    setResume(null);
  };

  // Get status color based on application status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "interview":
      case "interviewing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted":
      case "offered":
        return "bg-green-100 text-green-800 border-green-200";
      case "hired":
        return "bg-green-200 text-green-900 border-green-300 font-semibold";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "in review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Add this function inside your Applications component
  const deleteApplication = async (applicationId) => {
    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${backendUrl}/api/application/applications/${applicationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Application deleted successfully.");
        setUserApplicationsState((prev) =>
          prev.filter((app) => app._id !== applicationId)
        );
        // Optionally, also call await fetchUserData(); if you want to sync with backend
      } else {
        toast.error(data.message || "Failed to delete application.");
      }
    } catch (error) {
      toast.error("Failed to delete application. Please try again.");
    }
  };

  // Fetch messages for a specific application
  const fetchMessages = async (applicationId) => {
    if (!applicationId) return;

    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendUrl}/api/simple-chat/${applicationId}`
      );

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Send a message as an applicant
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedApplication?._id) return;

    try {
      setSending(true);

      const messageData = {
        applicationId: selectedApplication._id,
        senderType: "applicant",
        senderId: user?.id || "user",
        senderName:
          `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
          "Applicant",
        content: newMessage,
      };

      const { data } = await axios.post(
        `${backendUrl}/api/simple-chat/send`,
        messageData
      );

      if (data.success) {
        // Don't add message to local state here - let Socket.IO handle it
        // But add a fallback in case Socket.IO fails
        if (!isConnected) {
          console.log("Socket.IO not connected, adding message directly");
          setMessages((prev) => [...prev, data.message]);
        } else {
          // Add a timeout fallback in case Socket.IO event is delayed
          setTimeout(() => {
            setMessages((prev) => {
              const exists = prev.some((m) => m._id === data.message._id);
              if (!exists) {
                console.log(
                  "Socket.IO event delayed, adding message as fallback"
                );
                return [...prev, data.message];
              }
              return prev;
            });
          }, 2000); // 2 second timeout
        }
        setNewMessage("");

        // Stop typing indicator
        stopTyping({
          applicationId: selectedApplication._id,
          senderType: "applicant",
        });

        toast.success("Message sent successfully");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Open messaging modal
  const openMessagingModal = async (application) => {
    setSelectedApplication(application);
    setShowMessagingModal(true);
    setActiveChatId(application._id);
    await fetchMessages(application._id);

    // Scroll to bottom after messages are loaded
    setTimeout(() => {
      scrollToBottom(false); // Immediate scroll to latest message
    }, 200);

    // Mark messages as read when modal is opened
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/simple-chat/${application._id}`
      );
      if (data.success) {
        const unreadMessages = data.messages.filter(
          (msg) => msg.senderType === "recruiter" && !msg.read
        );

        // Mark each unread message as read
        for (const message of unreadMessages) {
          await axios.put(`${backendUrl}/api/simple-chat/${message._id}/read`);
        }

        // Update unread counts
        setUnreadCounts((prev) => ({
          ...prev,
          [application._id]: 0,
        }));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Format message timestamp
  const formatTimestamp = (timestamp) => {
    console.log(
      "Formatting timestamp (Applications):",
      timestamp,
      "Type:",
      typeof timestamp
    );

    // Handle null, undefined, or invalid timestamps
    if (!timestamp) {
      console.warn("No timestamp provided");
      return "Just now";
    }

    let date;

    // Handle different timestamp formats
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      console.warn("Invalid timestamp format:", timestamp);
      return "Just now";
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date created from timestamp:", timestamp);
      return "Just now";
    }

    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    console.log(
      "Date created (Applications):",
      date,
      "Diff in hours:",
      diffInHours
    );

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  // Get unread message count for an application
  const getUnreadCount = (application) => {
    return unreadCounts[application._id] || 0;
  };

  // Helper to get company name robustly
  const getCompanyName = (jobId) =>
    jobId?.companyId?.name ||
    jobId?.companyName ||
    jobId?.company ||
    jobId?.name ||
    jobId?.recruiterId?.fullName ||
    jobId?.recruiterId?.displayName ||
    jobId?.recruiterId?.contactPersonName ||
    "N/A";

  // Helper to get job type robustly
  const getJobType = (application) =>
    application.jobId?.workType ||
    application.jobId?.type ||
    application.type ||
    application.jobType ||
    "N/A";

  useEffect(() => {
    // Sum all unread counts
    const total = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalUnreadCount(total);
  }, [unreadCounts, setTotalUnreadCount]);

  // Add this function to remove the resume
  const handleRemoveResume = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/users/remove-resume`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Resume removed successfully.");
        await fetchUserData();
      } else {
        toast.error(data.message || "Failed to remove resume.");
      }
    } catch (error) {
      toast.error("Failed to remove resume. Please try again.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            My Applications
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your job applications, communicate with recruiters, and manage
            your hiring process all in one place.
          </p>
        </header>

        {/* Resume Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-50 rounded-xl shadow border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold text-gray-700">Your Resume</h2>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {isEdit || (userData && !userData.resume) ? (
              <div className="flex flex-wrap gap-3 w-full">
                <button
                  type="button"
                  className="flex items-center cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors duration-200 group"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  <Download className="w-5 h-5 text-gray-700 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-gray-700 font-medium">
                    {resume ? resume.name : "Select Resume"}
                  </span>
                </button>
                <input
                  id="resumeUpload"
                  type="file"
                  hidden
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => setResume(e.target.files[0])}
                />
                <button
                  onClick={updateResume}
                  className="bg-gray-700 text-white font-medium rounded-lg px-6 py-3 hover:bg-gray-800 transition-colors duration-200 flex items-center"
                >
                  <span>Save Resume</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 w-full">
                <a
                  className="flex items-center bg-gray-100 text-gray-700 font-medium px-5 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  href={userData?.resume || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <File className="w-5 h-5 mr-2 text-gray-700" />
                  View Resume
                </a>
                <button
                  onClick={handleRemoveResume}
                  className="flex items-center bg-white text-red-600 font-medium border border-red-300 px-5 py-3 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                  Remove Resume
                </button>
                <button
                  onClick={() => setIsEdit(true)}
                  className="flex items-center bg-white text-gray-700 font-medium border border-gray-300 px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4 mr-2 text-gray-700" />
                  Update Resume
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter Controls */}
        {userApplicationsState.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Filter Applications
                </h2>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {getActiveFiltersCount()} active filters
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FiFilter className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="interview">Interview</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Recruiter Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recruiter
                  </label>
                  <input
                    type="text"
                    placeholder="Search recruiter..."
                    value={filters.company}
                    onChange={(e) =>
                      setFilters({ ...filters, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                {/* Job Title Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="Search job title..."
                    value={filters.jobTitle}
                    onChange={(e) =>
                      setFilters({ ...filters, jobTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                {/* Job Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) =>
                      setFilters({ ...filters, jobType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {getUniqueJobTypes().map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Applied Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Applied
                  </label>
                  <select
                    value={filters.dateApplied}
                    onChange={(e) =>
                      setFilters({ ...filters, dateApplied: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {filters.status !== "all" && (
                    <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                      Status: {filters.status}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, status: "all" })
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.company && (
                    <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                      Recruiter: {filters.company}
                      <button
                        onClick={() => setFilters({ ...filters, company: "" })}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.jobTitle && (
                    <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                      Job: {filters.jobTitle}
                      <button
                        onClick={() => setFilters({ ...filters, jobTitle: "" })}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.jobType !== "all" && (
                    <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                      Type: {filters.jobType}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, jobType: "all" })
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.dateApplied !== "all" && (
                    <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                      Date: {filters.dateApplied}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, dateApplied: "all" })
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <section>
          {filteredApplications.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {filteredApplications.length} of{" "}
                  {userApplicationsState.length} applications
                </p>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      #
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Job Title
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Recruiter
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Location
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Salary
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Type
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Date Applied
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Status
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Message
                    </th>
                    <th className="py-3 px-3 text-left font-semibold text-sm">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application, index) => (
                    <tr
                      key={application._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-800">
                        {application.jobId
                          ? application.jobId.title || "Untitled Job"
                          : "Job no longer available"}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {application.jobId
                          ? getCompanyName(application.jobId)
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {application.jobId && application.jobId.location
                          ? `${application.jobId.location.town || ""}, ${
                              application.jobId.location.district || ""
                            }`
                          : "No Location"}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {application.jobId &&
                        application.jobId.salary !== undefined &&
                        application.jobId.salary !== null
                          ? `Le ${application.jobId.salary.toLocaleString()}`
                          : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {application.jobId ? getJobType(application) : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {moment(application.createdAt).format("MMMM Do, YYYY")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {application.jobId ? (
                          <button
                            onClick={() => openMessagingModal(application)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                          >
                            <MessageSquare size={14} />
                            Message
                            {getUnreadCount(application) > 0 && (
                              <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {getUnreadCount(application)}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => deleteApplication(application._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          aria-label="Delete application"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Briefcase size={60} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {userApplicationsState.length > 0
                  ? "No Applications Match Your Filters"
                  : "No Applications Yet"}
              </h2>
              <p className="text-gray-600 mb-6">
                {userApplicationsState.length > 0
                  ? "Try adjusting your filters to see more applications."
                  : "You haven't applied for any jobs yet. Start exploring and find your next opportunity!"}
              </p>
              {userApplicationsState.length === 0 && (
                <a
                  href="/"
                  className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg shadow-md hover:bg-gray-800 transition-colors"
                >
                  Browse Jobs
                </a>
              )}
              {userApplicationsState.length > 0 &&
                getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg shadow-md hover:bg-gray-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
            </motion.div>
          )}
        </section>

        <AnimatePresence>
          {showMessagingModal && selectedApplication && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 350, damping: 30 },
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  scale: 0.95,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Header */}
                <header className="flex-shrink-0 bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                      {selectedApplication.jobId?.companyId?.image ? (
                        <img
                          src={selectedApplication.jobId.companyId.image}
                          alt={
                            selectedApplication.jobId.companyId.name ||
                            "Company"
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          !selectedApplication.jobId?.companyId?.image
                            ? ""
                            : "hidden"
                        }`}
                        style={{
                          display: !selectedApplication.jobId?.companyId?.image
                            ? "flex"
                            : "none",
                        }}
                      >
                        <Building size={20} className="text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedApplication.jobId?.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Conversation with{" "}
                        {selectedApplication.jobId?.companyId?.name ||
                          selectedApplication.jobId?.recruiterId?.fullName ||
                          selectedApplication.jobId?.recruiterId?.displayName ||
                          selectedApplication.jobId?.recruiterId
                            ?.contactPersonName ||
                          "Recruiter"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowMessagingModal(false);
                      setSelectedApplication(null);
                      setMessages([]);
                    }}
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </header>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Messages container */}
                  <div className="flex-1 flex flex-col bg-white">
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 p-6 space-y-6 overflow-y-auto"
                    >
                      {loading ? (
                        <div className="text-center text-gray-500">
                          Loading messages...
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex gap-3 ${
                              message.senderType === "applicant"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {message.senderType === "recruiter" && (
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                <Building size={16} className="text-gray-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-md p-4 rounded-2xl ${
                                message.senderType === "applicant"
                                  ? "bg-gray-700 text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-800 rounded-bl-none"
                              }`}
                            >
                              {message.messageType === "audio" ? (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handlePlayVoiceMessage(
                                        message.content,
                                        message._id
                                      )
                                    }
                                    className="p-2 bg-white/20 rounded-full"
                                  >
                                    {isPlayingVoice &&
                                    playingMessageId === message._id ? (
                                      <Pause size={18} />
                                    ) : (
                                      <Play size={18} />
                                    )}
                                  </button>
                                  <div className="w-40 h-1 bg-white/30 rounded-full"></div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              )}
                              <div
                                className={`text-xs mt-2 ${
                                  message.senderType === "applicant"
                                    ? "text-gray-300"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatTimestamp(message.createdAt)}
                                {message.senderType === "applicant" &&
                                  message.read && (
                                    <span className="ml-2 font-semibold">
                                      Read
                                    </span>
                                  )}
                              </div>
                            </div>
                            {message.senderType === "applicant" && (
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {typingUsers.length > 0 && (
                      <div className="px-6 pb-2 text-sm text-gray-500 animate-pulse">
                        {typingUsers.map((user) => user.senderName).join(", ")}{" "}
                        is typing...
                      </div>
                    )}
                  </div>

                  {/* Recruiter details sidebar */}
                  <aside className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Application Feedback
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        {selectedApplication.feedback ||
                          "No feedback provided yet."}
                      </p>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-full border border-green-200">
                          <ThumbsUp size={14} />
                          Positive
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-full border border-red-200">
                          <ThumbsDown size={14} />
                          Negative
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>

                {/* Footer with message input */}
                <footer className="flex-shrink-0 bg-white p-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <VoiceRecorder onSend={handleSendVoiceMessage} />
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </footer>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Applications;
