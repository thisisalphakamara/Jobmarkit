import React, { useContext, useEffect, useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";
import { Zap, Briefcase, MessageSquare } from "lucide-react";
import { FiBookmark, FiMenu, FiX, FiArrowLeft } from "react-icons/fi";
import axios from "axios";

const Navbar = ({
  setShowAuthModal,
  setAuthMode,
  setShowRecruiterModal,
  setRecruiterMode,
}) => {
  const { user } = useUser();
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { backendUrl, userApplications, totalUnreadCount } =
    useContext(AppContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for unread messages
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (user && userApplications && userApplications.length > 0) {
        let totalUnread = 0;
        for (const application of userApplications) {
          try {
            const { data } = await axios.get(
              `${backendUrl}/api/simple-chat/${application._id}`
            );
            if (data.success) {
              const unreadCount = data.messages.filter(
                (msg) => msg.senderType === "recruiter" && !msg.read
              ).length;
              totalUnread += unreadCount;
            }
          } catch (error) {
            console.error("Error checking unread messages:", error);
          }
        }
        // setTotalUnreadCount(totalUnread); // This line is removed as totalUnreadCount is now from AppContext
      }
    };

    checkUnreadMessages();
    // Check every 30 seconds for new messages
    const interval = setInterval(checkUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [user, userApplications, backendUrl]);

  const handleGetStarted = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  return (
    <>
      <nav className="mx-8 rounded-xl bg-white shadow-sm border-b border-gray-100 py-6 px-8 flex justify-between items-center">
        {/* New Logo - updated with Professional Purple */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="bg-gray-700 p-2 rounded-lg group-hover:shadow-gray-700/30 transition-all duration-300">
            <Zap size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">Jobmarkit</span>
        </div>

        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Open menu"
        >
          {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>

        {/* User section with premium styling (desktop only) */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/applications"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Briefcase size={18} />
                <span className="font-medium">My Jobs</span>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/saved-jobs"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <FiBookmark size={18} />
                <span className="font-medium">Saved Jobs</span>
              </Link>

              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Hi, {user.firstName}
                  </span>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox:
                        "h-10 w-10 border-2 border-gray-200 shadow-md",
                      userButtonPopoverCard:
                        "shadow-2xl rounded-xl border border-gray-100",
                      userButtonTrigger: "focus:ring-2 focus:ring-gray-200",
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setRecruiterMode("signin");
                  setShowRecruiterModal(true);
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Recruiter Portal
              </button>
              <button
                onClick={handleGetStarted}
                className={`bg-gray-700 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-medium text-sm ${"hover:shadow-md"} transition-all duration-300`}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex flex-col md:hidden">
          <div className="bg-white shadow-xl rounded-b-2xl mx-4 mt-4 p-6 flex flex-col gap-6 animate-fadeInDown relative">
            {/* Back button */}
            <button
              className="absolute top-4 left-4 text-gray-700 bg-gray-100 rounded-full p-2 focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Back"
            >
              <FiArrowLeft size={24} />
            </button>
            {user ? (
              <>
                <Link
                  to="/applications"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100 relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase size={18} />
                  <span className="font-medium">My Jobs</span>
                  {totalUnreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {totalUnreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/saved-jobs"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiBookmark size={18} />
                  <span className="font-medium">Saved Jobs</span>
                </Link>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-medium text-gray-600">
                    Hi, {user.firstName}
                  </span>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox:
                          "h-10 w-10 border-2 border-gray-200 shadow-md",
                        userButtonPopoverCard:
                          "shadow-2xl rounded-xl border border-gray-100",
                        userButtonTrigger: "focus:ring-2 focus:ring-gray-200",
                      },
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setRecruiterMode("signin");
                    setShowRecruiterModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Recruiter Portal
                </button>
                <button
                  onClick={() => {
                    handleGetStarted();
                    setMobileMenuOpen(false);
                  }}
                  className={`bg-gray-700 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-medium text-sm ${"hover:shadow-md"} transition-all duration-300`}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
