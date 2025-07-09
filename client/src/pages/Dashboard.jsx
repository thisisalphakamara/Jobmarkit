import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import {
  LogOut,
  ChevronDown,
  LayoutGrid,
  PlusCircle,
  Briefcase,
  Users,
  Settings,
  Zap,
} from "lucide-react";
import Loading from "../components/Loading";

const Dashboard = () => {
  const {
    companyToken,
    setCompanyToken,
    setCompanyData,
    isCompanyAuthLoading,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect now handles redirection after the auth check is complete.
    if (!isCompanyAuthLoading && !companyToken) {
      navigate("/");
    }
  }, [companyToken, isCompanyAuthLoading, navigate]);

  const logout = () => {
    localStorage.removeItem("companyToken");
    setCompanyToken("");
    setCompanyData(null);
    navigate("/");
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

  if (isCompanyAuthLoading) {
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
