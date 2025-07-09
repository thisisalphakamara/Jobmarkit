import React, { useContext, useEffect, useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";
import { Zap, Briefcase, MessageSquare, Heart } from "lucide-react";
import axios from "axios";

const Navbar = ({ setShowAuthModal, setAuthMode }) => {
  const { user } = useUser();
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const {
    setShowRecruiterLogin,
    backendUrl,
    userApplications,
    totalUnreadCount,
  } = useContext(AppContext);

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

        {/* User section with premium styling */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/applications"
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100 relative"
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
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <Heart size={18} />
                <span className="font-medium">Saved Jobs</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
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
                onClick={(e) => setShowRecruiterLogin(true)}
                className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
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
    </>
  );
};

export default Navbar;
