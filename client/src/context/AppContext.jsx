import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();

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
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
