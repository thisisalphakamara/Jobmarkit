import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSocket } from "./SocketContext";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();
  const { socket } = useSocket();

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });

  const [isSearched, setIsSearched] = useState(false);

  const [jobs, setJobs] = useState([]);

  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

  const [companyToken, setCompanyToken] = useState(() =>
    localStorage.getItem("companyToken")
  );
  const [companyData, setCompanyData] = useState(null);
  const [isCompanyAuthLoading, setIsCompanyAuthLoading] = useState(true);

  const [userData, setUserData] = useState(null);
  const [userApplications, setUserApplications] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateJobs = (newJobs) => {
    setJobs(newJobs);
  };

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/jobs");

      if (data.success) {
        setJobs(data.jobs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logoutCompany = () => {
    setCompanyToken(null);
    setCompanyData(null);
    localStorage.removeItem("companyToken");
    localStorage.removeItem("companyData");
    setIsCompanyAuthLoading(false);
  };

  const fetchCompanyData = async () => {
    if (!companyToken) {
      setIsCompanyAuthLoading(false);
      return;
    }

    setIsCompanyAuthLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/company/company", {
        headers: { token: companyToken },
      });
      const data = response.data;

      if (data.success) {
        setCompanyData(data.company);
      } else {
        toast.error(data.message);
        logoutCompany();
      }
    } catch (error) {
      toast.error("Session expired. Please log in again.");
      logoutCompany();
    } finally {
      setIsCompanyAuthLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(backendUrl + "/api/users/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(backendUrl + "/api/users/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserApplications(data.applications);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchJobs();

    const storedCompanyToken = localStorage.getItem("companyToken");

    if (storedCompanyToken) {
      setCompanyToken(storedCompanyToken);
    }
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyData();
    }
  }, [companyToken]);

  useEffect(() => {
    if (companyData) {
      const storedCompanyData = JSON.stringify(companyData);
      localStorage.setItem("companyData", storedCompanyData);
    }
  }, [companyData]);

  useEffect(() => {
    const storedCompanyData = localStorage.getItem("companyData");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserApplications();
    }
  }, [user]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (companyToken) {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/company/list-jobs`,
            {
              headers: { token: companyToken },
            }
          );
          if (data.success) {
            setJobs(data.jobsData.reverse());
          }
        } catch (error) {
          console.error("Error fetching jobs:", error);
        }
      }
    };

    fetchJobs();
  }, [companyToken, backendUrl]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageReceived = (message) => {
      // For recruiters, increment unread count when message is from applicant
      if (message.senderType === "applicant") {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.applicationId]: (prev[message.applicationId] || 0) + 1,
        }));
      }
      // If you want to handle applicant-side unread logic, add similar logic for recruiter messages here
    };
    socket.on("message-received", handleMessageReceived);
    return () => {
      socket.off("message-received", handleMessageReceived);
    };
  }, [socket]);

  useEffect(() => {
    const total = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalUnreadCount(total);
  }, [unreadCounts]);

  useEffect(() => {
    // Initialize unreadCounts for recruiters on login/app load
    const initializeUnreadCounts = async () => {
      if (!companyToken) return;
      try {
        // Fetch all applications for this recruiter/company
        const { data: appData } = await axios.get(
          `${backendUrl}/api/company/applicants`,
          {
            headers: { token: companyToken },
          }
        );
        if (appData.success) {
          const applications = appData.applications.filter(
            (app) => app.jobId && app.userId
          );
          const counts = {};
          for (const applicant of applications) {
            try {
              const { data: messageData } = await axios.get(
                `${backendUrl}/api/simple-chat/${applicant._id}`
              );
              if (messageData.success) {
                const unreadCount = messageData.messages.filter(
                  (msg) => msg.senderType === "applicant" && !msg.read
                ).length;
                counts[applicant._id] = unreadCount;
              }
            } catch (error) {
              // Ignore errors for individual applicants
            }
          }
          setUnreadCounts(counts);
        }
      } catch (error) {
        // Ignore errors for initial unread fetch
      }
    };
    initializeUnreadCounts();
  }, [companyToken, backendUrl]);

  const value = {
    searchFilter,
    setSearchFilter,
    setIsSearched,
    isSearched,
    jobs,
    setJobs,
    setShowRecruiterLogin,
    showRecruiterLogin,
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    backendUrl,
    userData,
    setUserData,
    userApplications,
    setUserApplications,
    fetchUserData,
    fetchUserApplications,
    updateJobs,
    isCompanyAuthLoading,
    isModalOpen,
    setIsModalOpen,
    totalUnreadCount,
    setTotalUnreadCount,
    unreadCounts,
    setUnreadCounts,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
