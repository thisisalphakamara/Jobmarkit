import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useContext,
} from "react";
import { AppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import VoiceRecorder from "./VoiceRecorder";
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  X,
  Clock,
  User,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Smile,
  MoreHorizontal,
  Search,
  Filter,
  Archive,
  Trash2,
  Edit,
  Copy,
  Download,
  Eye,
  EyeOff,
  Play,
  Pause,
  Building,
  MapPin,
  LinkIcon,
} from "lucide-react";

const MessagingSystem = ({ selectedApplicant, onClose }) => {
  const { backendUrl, companyToken, companyData } = useContext(AppContext);
  const {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
  } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [applicantData, setApplicantData] = useState(selectedApplicant);
  const initialApplicantRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const audioRef = useRef(null);
  const [isActivelyViewing, setIsActivelyViewing] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const messagesContainerRef = useRef(null);

  // Message templates for Sierra Leone context
  const messageTemplates = [
    {
      id: "shortlisted",
      title: "Shortlisted for Interview",
      category: "Interview",
      template: `Dear {applicantName},

Congratulations! We are pleased to inform you that your application for the {jobTitle} position has been shortlisted for an interview.

Interview Details:
📅 Date: {interviewDate}
⏰ Time: {interviewTime}
📍 Location: {interviewLocation}
🔗 Meeting Link: {meetingLink}

Please confirm your attendance by replying to this message.

Best regards,
{companyName} Team`,
      variables: [
        "applicantName",
        "jobTitle",
        "interviewDate",
        "interviewTime",
        "interviewLocation",
        "meetingLink",
        "companyName",
      ],
    },
    {
      id: "interview_scheduled",
      title: "Interview Scheduled",
      category: "Interview",
      template: `Hello {applicantName},

Your interview for the {jobTitle} position has been scheduled.

📅 Date: {interviewDate}
⏰ Time: {interviewTime}
📍 Location: {interviewLocation}
🔗 Meeting Link: {meetingLink}

Please arrive 10 minutes early and bring a copy of your resume.

Best regards,
{companyName}`,
      variables: [
        "applicantName",
        "jobTitle",
        "interviewDate",
        "interviewTime",
        "interviewLocation",
        "meetingLink",
        "companyName",
      ],
    },
    {
      id: "accepted",
      title: "Application Accepted",
      category: "Status Update",
      template: `Dear {applicantName},

We are delighted to inform you that your application for the {jobTitle} position has been accepted!

🎉 Welcome to the {companyName} team!

Next Steps:
1. We will send you the offer letter within 24 hours
2. Please review and sign the employment contract
3. Complete the onboarding process

Start Date: {startDate}
Location: {workLocation}

We look forward to having you on board!

Best regards,
{companyName} HR Team`,
      variables: [
        "applicantName",
        "jobTitle",
        "companyName",
        "startDate",
        "workLocation",
      ],
    },
    {
      id: "rejected",
      title: "Application Status Update",
      category: "Status Update",
      template: `Dear {applicantName},

Thank you for your interest in the {jobTitle} position at {companyName}.

After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you took to apply and wish you the best in your future endeavors.

Best regards,
{companyName} Team`,
      variables: ["applicantName", "jobTitle", "companyName"],
    },
    {
      id: "test_invitation",
      title: "Skills Assessment Invitation",
      category: "Assessment",
      template: `Hello {applicantName},

As part of our selection process for the {jobTitle} position, we would like to invite you to complete a skills assessment.

📝 Assessment Type: {testType}
⏱️ Duration: {testDuration}
🔗 Link: {testLink}
📅 Deadline: {deadline}

Please complete the assessment within the specified timeframe.

Best regards,
{companyName}`,
      variables: [
        "applicantName",
        "jobTitle",
        "testType",
        "testDuration",
        "testLink",
        "deadline",
        "companyName",
      ],
    },
    {
      id: "follow_up",
      title: "Application Follow-up",
      category: "General",
      template: `Hello {applicantName},

We hope this message finds you well. We wanted to follow up on your application for the {jobTitle} position.

Your application is currently under review, and we will provide an update within the next few days.

Thank you for your patience.

Best regards,
{companyName} Team`,
      variables: ["applicantName", "jobTitle", "companyName"],
    },
    {
      id: "custom",
      title: "Custom Message",
      category: "General",
      template: "",
      variables: [],
    },
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (applicantData?._id && messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      });
    }
  }, [messages, applicantData?._id]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  // Store the initial applicant data when component first receives it
  useEffect(() => {
    if (selectedApplicant && !initialApplicantRef.current) {
      console.log("Storing initial applicant data:", selectedApplicant);
      initialApplicantRef.current = selectedApplicant;
      setApplicantData(selectedApplicant);
      // Scroll to bottom when a new applicant is selected
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [selectedApplicant]);

  // Fetch messages when applicantData is available
  useEffect(() => {
    if (applicantData?._id) {
      fetchMessages();
    }
  }, [applicantData?._id]);

  // Fetch messages for the selected applicant
  const fetchMessages = async () => {
    if (!applicantData?._id) return;

    try {
      setLoading(true);
      console.log("Fetching messages for applicant:", applicantData._id);
      console.log("Current applicantData:", applicantData);

      const { data } = await axios.get(
        `${backendUrl}/api/simple-chat/${applicantData._id}`
      );

      console.log("Backend response:", data);

      if (data.success) {
        setMessages(data.messages || []);

        // Only update applicantData if we don't already have the name and title
        // This preserves the populated data from ViewApplications
        const hasName =
          applicantData.userId?.name ||
          initialApplicantRef.current?.userId?.name;
        const hasTitle =
          applicantData.jobId?.title ||
          initialApplicantRef.current?.jobId?.title;

        if (data.application && (!hasName || !hasTitle)) {
          console.log("Updating applicantData with backend data");
          const updatedApplicant = {
            ...applicantData,
            userId: {
              ...applicantData.userId,
              name:
                data.application.applicantName ||
                applicantData.userId?.name ||
                initialApplicantRef.current?.userId?.name,
            },
            jobId: {
              ...applicantData.jobId,
              title:
                data.application.jobTitle ||
                applicantData.jobId?.title ||
                initialApplicantRef.current?.jobId?.title,
            },
          };

          console.log("Updated applicantData:", updatedApplicant);
          setApplicantData(updatedApplicant);
        } else {
          console.log("Keeping existing applicantData:", applicantData);
          console.log("Has name:", hasName);
          console.log("Has title:", hasTitle);
        }

        // Mark applicant messages as read when opened by recruiter
        const unreadApplicantMessages = data.messages.filter(
          (msg) => msg.senderType === "applicant" && !msg.read
        );

        for (const message of unreadApplicantMessages) {
          try {
            await axios.put(
              `${backendUrl}/api/simple-chat/${message._id}/read`
            );
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);

      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        scrollToBottom(); // Immediate scroll to latest message
      }, 200);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !applicantData?._id) return;

    try {
      setSending(true);

      const messageData = {
        applicationId: applicantData._id,
        senderType: "recruiter",
        senderId: companyData?._id || "company",
        senderName: companyData?.name || "Recruiter",
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
        setSelectedTemplate(null);

        // Stop typing indicator
        stopTyping({
          applicationId: applicantData._id,
          senderType: "recruiter",
        });

        toast.success("Message sent successfully");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);

    if (template.id === "custom") {
      setNewMessage("");
    } else {
      let messageText = template.template;

      // Replace variables with actual values
      const variables = {
        applicantName: applicantData?.userId?.name || "Applicant",
        jobTitle: applicantData?.jobId?.title || "Position",
        companyName: "Your Company",
        interviewDate: "To be scheduled",
        interviewTime: "To be scheduled",
        interviewLocation: "To be determined",
        meetingLink: "To be provided",
        startDate: "To be determined",
        workLocation: applicantData?.jobId?.location || "Office",
        testType: "Skills Assessment",
        testDuration: "30 minutes",
        testLink: "To be provided",
        deadline: "Within 48 hours",
      };

      template.variables.forEach((variable) => {
        const regex = new RegExp(`{${variable}}`, "g");
        messageText = messageText.replace(regex, variables[variable] || "");
      });

      setNewMessage(messageText);
    }
  };

  // Handle file attachment
  const handleFileAttachment = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file attachment logic here
      console.log("File attached:", file);
    }
  };

  const handleSendVoiceMessage = async (audioBlob) => {
    if (!audioBlob || !applicantData?._id) return;

    try {
      setSending(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      formData.append("applicationId", applicantData._id);
      formData.append("senderType", "recruiter");
      formData.append("senderId", companyData?._id || "company");
      formData.append("senderName", companyData?.name || "Recruiter");

      console.log("Sending voice message with data:", {
        applicationId: applicantData._id,
        senderType: "recruiter",
        senderId: companyData?._id || "company",
        senderName: companyData?.name || "Recruiter",
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

  // Format message timestamp
  const formatTimestamp = (timestamp) => {
    console.log("Formatting timestamp:", timestamp, "Type:", typeof timestamp);

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

    console.log("Date created:", date, "Diff in hours:", diffInHours);

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

  useEffect(() => {
    if (selectedApplicant) {
      console.log(
        "Setting applicantData from selectedApplicant:",
        selectedApplicant
      );
      console.log("selectedApplicant.userId:", selectedApplicant.userId);
      console.log("selectedApplicant.jobId:", selectedApplicant.jobId);

      // Store the initial data in a ref
      if (!initialApplicantRef.current) {
        initialApplicantRef.current = selectedApplicant;
        console.log(
          "Stored initial applicant data in ref:",
          initialApplicantRef.current
        );
      }

      setApplicantData(selectedApplicant);
      fetchMessages();
    }
  }, [selectedApplicant]);

  // Debug effect to track applicantData changes
  useEffect(() => {
    console.log("applicantData changed:", applicantData);
    console.log("applicantData.userId?.name:", applicantData?.userId?.name);
    console.log("applicantData.jobId?.title:", applicantData?.jobId?.title);
  }, [applicantData]);

  // Cleanup effect to reset ref when selectedApplicant changes
  useEffect(() => {
    return () => {
      if (selectedApplicant !== initialApplicantRef.current) {
        console.log(
          "Resetting initialApplicantRef due to selectedApplicant change"
        );
        initialApplicantRef.current = null;
      }
    };
  }, [selectedApplicant]);

  // Mark messages as read when user is actively viewing the chat
  const markMessagesAsRead = async (applicationId) => {
    if (!isActivelyViewing || !applicationId || activeChatId !== applicationId)
      return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/simple-chat/${applicationId}`
      );
      if (data.success) {
        const unreadMessages = data.messages.filter(
          (msg) => msg.senderType === "applicant" && !msg.read
        );

        // Mark each unread message as read
        for (const message of unreadMessages) {
          await axios.put(`${backendUrl}/api/simple-chat/${message._id}/read`);
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Socket.IO event listeners for real-time messaging
  useEffect(() => {
    if (!socket || !applicantData?._id) return;

    // Join the chat room when component mounts
    joinChat(applicantData._id);

    // Listen for new messages
    const handleMessageReceived = (message) => {
      console.log("Real-time message received:", message);
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

      // If actively viewing, mark the message as read immediately
      if (
        isActivelyViewing &&
        message.senderType === "applicant" &&
        activeChatId === applicantData._id
      ) {
        markMessagesAsRead(applicantData._id);
      } else if (
        message.senderType === "applicant" &&
        (!isActivelyViewing || activeChatId !== applicantData._id)
      ) {
        // Show toast notification for new message if not actively viewing
        toast.info("New message from applicant!");
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.senderType !== "recruiter") {
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
      if (data.senderType !== "recruiter") {
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
      leaveChat(applicantData._id);
      socket.off("message-received", handleMessageReceived);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
      socket.off("message-marked-read", handleMessageRead);
    };
  }, [
    socket,
    applicantData?._id,
    joinChat,
    leaveChat,
    isActivelyViewing,
    activeChatId,
  ]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!applicantData?._id) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    startTyping({
      applicationId: applicantData._id,
      senderType: "recruiter",
      senderName: companyData?.name || "Recruiter",
    });

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping({
        applicationId: applicantData._id,
        senderType: "recruiter",
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

  // Set actively viewing to true when component mounts
  useEffect(() => {
    setIsActivelyViewing(true);
    setActiveChatId(applicantData?._id);
    return () => {
      setIsActivelyViewing(false);
      setActiveChatId(null);
    };
  }, [applicantData?._id]);

  // Helper to determine if the message is sent by the current user (recruiter)
  const isSender = (message) => message.senderType === "recruiter";

  if (!initialApplicantRef.current && !selectedApplicant && !applicantData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select an applicant to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden border border-gray-200 flex flex-col"
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
            {applicantData.userId?.image ? (
              <img
                src={applicantData.userId.image}
                alt={applicantData.userId.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {applicantData.userId?.name || "Applicant"}
            </h2>
            <p className="text-sm text-gray-600">
              Conversation about {applicantData.jobId?.title || "Position"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
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
                    isSender(message) ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isSender(message) && (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-md p-4 rounded-2xl ${
                      isSender(message)
                        ? "bg-gray-700 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {message.messageType === "audio" ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handlePlayVoiceMessage(message.content, message._id)
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
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div
                      className={`text-xs mt-2 ${
                        isSender(message) ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(message.createdAt)}
                      {isSender(message) && message.read && (
                        <span className="ml-2 font-semibold">Read</span>
                      )}
                    </div>
                  </div>
                  {isSender(message) && (
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
              {typingUsers.map((user) => user.senderName).join(", ")} is
              typing...
            </div>
          )}
        </div>

        {/* Sidebar with applicant/job details and feedback */}
        <aside className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            About the Applicant
          </h3>
          <div className="space-y-4 text-sm">
            {/* Match Score */}
            {typeof applicantData.matchScore === "number" && (
              <div className="flex items-center gap-3">
                <Star size={16} className="text-yellow-500" />
                <span className="text-gray-700 font-semibold">
                  Match Score:
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {applicantData.matchScore}%
                </span>
              </div>
            )}
            {/* Status */}
            {applicantData.status && (
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold">Status:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${(() => {
                    const s = applicantData.status.toLowerCase();
                    if (s === "pending") return "bg-purple-100 text-purple-800";
                    if (s === "screening") return "bg-amber-100 text-amber-800";
                    if (s === "interview")
                      return "bg-yellow-100 text-yellow-800";
                    if (s === "accepted" || s === "hired")
                      return "bg-emerald-100 text-emerald-800";
                    if (s === "rejected") return "bg-red-100 text-red-800";
                    return "bg-gray-100 text-gray-800";
                  })()}`}
                >
                  {applicantData.status.charAt(0).toUpperCase() +
                    applicantData.status.slice(1)}
                </span>
              </div>
            )}
            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-500" />
              <span className="text-gray-700">
                {applicantData.userId?.email || "Not provided"}
              </span>
            </div>
            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-gray-500" />
              <span className="text-gray-700">
                {applicantData.userId?.phone || "Not provided"}
              </span>
            </div>
            {/* Location */}
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-gray-500" />
              <span className="text-gray-700">
                {applicantData.userId?.location || "Not provided"}
              </span>
            </div>
          </div>
          <div className="my-6 border-t border-gray-200"></div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Application Feedback
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {applicantData.feedback || "No feedback provided yet."}
            </p>
            {/* Feedback buttons can be added here if needed */}
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
  );
};

export default MessagingSystem;
