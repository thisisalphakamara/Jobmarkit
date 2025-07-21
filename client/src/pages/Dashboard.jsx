import { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  LogOut,
  LayoutGrid,
  PlusCircle,
  Briefcase,
  Users,
  Settings,
  Zap,
  User,
} from "lucide-react";
import Loading from "../components/Loading";

const Dashboard = () => {
  const {
    companyToken,
    recruiterToken,
    setCompanyToken,
    setCompanyData,
    logoutRecruiter,
    isCompanyAuthLoading,
    recruiterData: contextRecruiterData,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Local recruiterData for display, synced with context
  const [recruiterData, setRecruiterData] = useState(contextRecruiterData);

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

    // If we have recruiter data and it's a company, redirect to company dashboard
    if (recruiterData && recruiterData.recruiterType === "Company") {
      navigate("/company-dashboard");
    }
  }, [
    companyToken,
    recruiterToken,
    isCompanyAuthLoading,
    navigate,
    recruiterData,
  ]);

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
      return recruiterData.contactPersonName || "Recruiter";
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

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutGrid size={18} /> },
    {
      name: "Add Job",
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
  ];

  // Only show loading for company auth, not for recruiter auth
  if (isCompanyAuthLoading && !recruiterToken) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex-shrink-0 sticky top-0 h-screen">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gray-700 p-1.5 rounded-lg group-hover:shadow-lg group-hover:shadow-gray-700/30 transition-all duration-300">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Jobmarkit</span>
          </Link>
        </div>

        {/* Recruiter Profile Section */}
        {recruiterToken && recruiterData && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                {recruiterData.logo ? (
                  <img
                    src={recruiterData.logo}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 text-white text-sm font-bold flex items-center justify-center border-2 border-gray-200">
                    {getInitials(getDisplayName())}
                  </div>
                )}
              </div>
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
                  {recruiterData.recruiterType}
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
        )}

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
        <div className="absolute bottom-0 w-52 p-3 border-t border-gray-200">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 mt-2 text-sm"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
