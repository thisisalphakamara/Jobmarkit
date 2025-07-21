import { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  LogOut,
  LayoutGrid,
  PlusCircle,
  Briefcase,
  Users,
  Building,
  BarChart3,
  Calendar,
  TrendingUp,
  User,
  Bell,
  Search,
  Zap,
} from "lucide-react";
import Loading from "../components/Loading";
import axios from "axios";

const CompanyDashboard = () => {
  const { recruiterToken, logoutRecruiter, backendUrl } =
    useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [recruiterData, setRecruiterData] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    recentApplications: 0,
  });

  useEffect(() => {
    if (!recruiterToken) {
      navigate("/");
      return;
    }
    setLoading(false);
  }, [recruiterToken, navigate]);

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
    logoutRecruiter();
    navigate("/");
  };

  const getDisplayName = () => {
    if (!recruiterData) return "Organization";
    return recruiterData.organizationName || "Organization";
  };

  const getInitials = (name) => {
    if (!name) return "O";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    {
      name: "Overview",
      path: "/company-dashboard",
      icon: <LayoutGrid size={18} />,
    },
    {
      name: "Post Job",
      path: "/company-dashboard/post-job",
      icon: <PlusCircle size={18} />,
    },
    {
      name: "Manage Jobs",
      path: "/company-dashboard/manage-jobs",
      icon: <Briefcase size={18} />,
    },
    {
      name: "Applications",
      path: "/company-dashboard/applications",
      icon: <Users size={18} />,
    },
    {
      name: "Analytics",
      path: "/company-dashboard/analytics",
      icon: <BarChart3 size={18} />,
    },
    {
      name: "Company Profile",
      path: "/company-dashboard/profile",
      icon: <Building size={18} />,
    },
  ];

  if (loading) {
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

        {/* Company Profile Section */}
        {recruiterToken && recruiterData && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                {recruiterData.logo ? (
                  <img
                    src={recruiterData.logo}
                    alt="Company Logo"
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
                  Hi, {getDisplayName().split(" ")[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Company Account
                </p>
              </div>
              <Link
                to="/company-dashboard/profile"
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
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm w-full transition-colors"
          >
            <LogOut size={16} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {location.pathname === "/company-dashboard"
                  ? "Dashboard Overview"
                  : location.pathname.includes("post-job")
                  ? "Post New Job"
                  : location.pathname.includes("manage-jobs")
                  ? "Manage Jobs"
                  : location.pathname.includes("applications")
                  ? "Applications"
                  : location.pathname.includes("analytics")
                  ? "Analytics"
                  : location.pathname.includes("profile")
                  ? "Company Profile"
                  : "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell size={20} />
              </button>
              <div className="w-64">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search jobs, applications..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6">
          {location.pathname === "/company-dashboard" ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Jobs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalJobs}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Briefcase size={20} className="text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Jobs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.activeJobs}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <TrendingUp size={20} className="text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Applications
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalApplications}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Users size={20} className="text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Recent Applications
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.recentApplications}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Calendar size={20} className="text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      to="/company-dashboard/post-job"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <PlusCircle size={20} />
                      <span className="font-medium">Post New Job</span>
                    </Link>
                    <Link
                      to="/company-dashboard/applications"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Users size={20} />
                      <span className="font-medium">View Applications</span>
                    </Link>
                    <Link
                      to="/company-dashboard/analytics"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <BarChart3 size={20} />
                      <span className="font-medium">View Analytics</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        New application received for Software Engineer
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Job &quot;Marketing Manager&quot; published successfully
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        5 applications reviewed today
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
