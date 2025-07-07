import React, { useContext, useState, useEffect, useRef } from "react";
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

  const context = useContext(AppContext);
  const { backendUrl, userData, userApplications, fetchUserData } = context;

  useEffect(() => {
    setUserApplicationsState(userApplications || []);
  }, [userApplications]);

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
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  useEffect(() => {
    // Use immediate scroll for new messages to avoid delay
    const isNewMessage =
      messages.length > 0 && messages[messages.length - 1]?.timestamp;
    const isRecentMessage =
      isNewMessage &&
      new Date(messages[messages.length - 1].timestamp).getTime() >
        Date.now() - 10000; // Within last 10 seconds

    scrollToBottom(!isRecentMessage); // Smooth for old messages, immediate for new ones
  }, [messages]);

  // Scroll to bottom when modal is first opened
  useEffect(() => {
    if (showMessagingModal && messages.length > 0) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [showMessagingModal, messages.length]);

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
    switch (status) {
      case "In Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Interviewing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Offered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Hired":
        return "bg-green-200 text-green-900 border-green-300 font-semibold";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
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
    // This would need to be implemented with a backend endpoint
    // For now, return 0
    return 0;
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
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Your Resume</h2>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {isEdit || (userData && !userData.resume) ? (
              <div className="flex flex-wrap gap-3 w-full">
                <button
                  type="button"
                  className="flex items-center cursor-pointer bg-white border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors duration-200 group"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  <Download className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-blue-600 font-medium">
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
                  className="bg-blue-600 text-white font-medium rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <span>Save Resume</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 w-full">
                <a
                  className="flex items-center bg-blue-50 text-blue-600 font-medium px-5 py-3 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  href={userData?.resume || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <File className="w-5 h-5 mr-2" />
                  View Resume
                </a>
                <button
                  onClick={() => setIsEdit(true)}
                  className="flex items-center bg-white text-gray-600 font-medium border border-gray-200 px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Resume
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <section>
          <AnimatePresence>
            {userApplicationsState.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {userApplicationsState.map((application, index) => (
                  <motion.div
                    key={application._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                            <img
                              src={application.jobId?.companyId?.image}
                              alt={application.jobId?.companyId?.name}
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {application.jobId?.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {application.jobId?.companyId?.name}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span>
                            {application.jobId?.location
                              ? `${application.jobId.location.town}, ${application.jobId.location.district}, ${application.jobId.location.province}`
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-gray-400" />
                          <span>{application.jobId?.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span>
                            Applied on{" "}
                            {moment(application.createdAt).format(
                              "MMMM Do, YYYY"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => openMessagingModal(application)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                      >
                        <MessageSquare size={16} />
                        Messages
                        {getUnreadCount(application) > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {getUnreadCount(application)}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => deleteApplication(application._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        aria-label="Delete application"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Briefcase size={60} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  No Applications Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  You haven't applied for any jobs yet. Start exploring and find
                  your next opportunity!
                </p>
                <a
                  href="/"
                  className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg shadow-md hover:bg-gray-800 transition-colors"
                >
                  Browse Jobs
                </a>
              </motion.div>
            )}
          </AnimatePresence>
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
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <img
                        src={selectedApplication.jobId?.companyId?.image}
                        alt={selectedApplication.jobId?.companyId?.name}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedApplication.jobId?.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Conversation with{" "}
                        {selectedApplication.jobId?.companyId?.name}
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
                      ref={messagesEndRef}
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
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                      About{" "}
                      {selectedApplication.jobId?.companyId?.name ||
                        "the company"}
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedApplication.jobId?.companyId?.email ||
                            "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedApplication.jobId?.companyId?.phone ||
                            "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedApplication.jobId?.companyId?.location ||
                            "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <LinkIcon size={16} className="text-gray-500" />
                        <a
                          href={
                            selectedApplication.jobId?.companyId?.website || "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                    <div className="my-6 border-t border-gray-200"></div>
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
