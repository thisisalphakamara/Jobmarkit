import { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  LogOut,
  LayoutGrid,
  PlusCircle,
  Briefcase,
  Users,
  Zap,
  User,
  BarChart3,
  Bell,
} from "lucide-react";
import Loading from "../components/Loading";
import axios from "axios";

const Dashboard = () => {
  const {
    companyToken,
    recruiterToken,
    setCompanyToken,
    setCompanyData,
    logoutRecruiter,
    isCompanyAuthLoading,
    recruiterData: contextRecruiterData,
    backendUrl,
    totalUnreadCount,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Local recruiterData for display, synced with context
  const [recruiterData, setRecruiterData] = useState(contextRecruiterData);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    recentApplications: 0,
  });

  // Sync local recruiterData with context recruiterData (updates after profile change)
  useEffect(() => {
    setRecruiterData(contextRecruiterData);
  }, [contextRecruiterData]);

  useEffect(() => {
    // This effect now handles redirection after the auth check is complete.
    console.log("Dashboard auth check:", {
      isCompanyAuthLoading,
      companyToken: !!companyToken,
      recruiterToken: !!recruiterToken,
    });

    if (!isCompanyAuthLoading && !companyToken && !recruiterToken) {
      navigate("/");
      return;
    }
  }, [companyToken, recruiterToken, isCompanyAuthLoading, navigate]);

  // Fetch recruiter data for profile display
  useEffect(() => {
    const fetchRecruiterData = async () => {
      if (!recruiterToken) return;

      try {
        const response = await axios.get(
          `${backendUrl}/api/recruiters/profile`,
          {
            headers: {
              Authorization: `Bearer ${recruiterToken}`,
            },
          }
        );

        if (response.data.success) {
          setRecruiterData(response.data.recruiter);
        }
      } catch (error) {
        console.error("Error fetching recruiter data:", error);
      }
    };

    fetchRecruiterData();
  }, [recruiterToken, backendUrl]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!recruiterToken) return;

      try {
        const response = await axios.get(
          `${backendUrl}/api/recruiters/dashboard-stats`,
          {
            headers: {
              Authorization: `Bearer ${recruiterToken}`,
            },
          }
        );

        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, [recruiterToken, backendUrl]);

  const logout = () => {
    if (companyToken) {
      localStorage.removeItem("companyToken");
      setCompanyToken("");
      setCompanyData(null);
    } else if (recruiterToken) {
      logoutRecruiter();
    }
    navigate("/");
  };

  // Helper functions for recruiter profile display
  const getDisplayName = () => {
    if (!recruiterData) return "Recruiter";

    if (recruiterData.recruiterType === "Individual") {
      return recruiterData.fullName || "Recruiter";
    } else {
      return recruiterData.organizationName || "Organization";
    }
  };

  const getInitials = (name) => {
    if (!name) return "R";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isCompanyRecruiter = recruiterData?.recruiterType === "Company";

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutGrid size={18} /> },
    {
      name: isCompanyRecruiter ? "Post Job" : "Add Job",
      path: "/dashboard/add-job",
      icon: <PlusCircle size={18} />,
    },
    {
      name: "Manage Jobs",
      path: "/dashboard/manage-jobs",
      icon: <Briefcase size={18} />,
    },
    {
      name: "Applications",
      path: "/dashboard/view-applications",
      icon: <Users size={18} />,
    },
    // Only show Analytics for company recruiters
    ...(isCompanyRecruiter
      ? [
          {
            name: "Analytics",
            path: "/dashboard/analytics",
            icon: <BarChart3 size={18} />,
          },
        ]
      : []),
  ];

  // Only show loading for company auth, not for recruiter auth
  if (isCompanyAuthLoading && !recruiterToken) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-white shadow-sm border-r border-gray-200 flex flex-col overflow-y-auto z-10">
        {/* Logo/Brand - match Navbar styling */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Jobmarkit</h1>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {recruiterData?.logo ? (
              <img
                src={recruiterData.logo}
                alt={getDisplayName()}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {getInitials(getDisplayName())}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Hi
                {recruiterData &&
                recruiterData.recruiterType === "Individual" &&
                recruiterData.fullName
                  ? ` ${recruiterData.fullName.split(" ")[0]}`
                  : getDisplayName() !== "Recruiter"
                  ? ` ${getDisplayName().split(" ")[0]}`
                  : " Recruiter"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {recruiterData?.recruiterType || "Recruiter"}
              </p>
            </div>
            <Link
              to="/dashboard/profile"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <User size={16} />
            </Link>
          </div>
        </div>

        <nav className="mt-6 px-2">
          <ul>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === link.path
                      ? "bg-gray-700 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.icon}
                  <span className="font-medium text-base">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors w-full"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {location.pathname === "/dashboard" && "Dashboard"}
              {location.pathname === "/dashboard/add-job" &&
                (isCompanyRecruiter ? "Post Job" : "Add Job")}
              {location.pathname === "/dashboard/manage-jobs" && "Manage Jobs"}
              {location.pathname === "/dashboard/view-applications" &&
                "Applications"}
              {location.pathname === "/dashboard/analytics" && "Analytics"}
              {location.pathname === "/dashboard/profile" && "Profile"}
              {location.pathname.includes("/dashboard/edit-job/") && "Edit Job"}
            </h2>
            <div className="flex items-center gap-4">
              {/* Bell notification with unread messages count */}
              {location.pathname === "/dashboard" && (
                <button
                  onClick={() =>
                    navigate("/dashboard/view-applications", {
                      state: { sortUnreadTop: true },
                    })
                  }
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Unread messages"
                >
                  <Bell size={22} className="text-gray-700" />
                  {typeof totalUnreadCount === "number" && totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold px-1.5 h-5 min-w-[1.25rem]">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
