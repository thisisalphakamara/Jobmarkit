import { useContext, useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";
import { Zap, Briefcase } from "lucide-react";
import { FiBookmark, FiMenu, FiX, FiArrowLeft } from "react-icons/fi";
import PropTypes from "prop-types";

const Navbar = ({
  setShowAuthModal,
  setAuthMode,
  setShowRecruiterModal,
  setRecruiterMode,
}) => {
  const { user } = useUser();
  useAuthContext();
  const navigate = useNavigate();
  const { totalUnreadCount } = useContext(AppContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Removed unused checkUnreadMessages logic

  const handleGetStarted = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const handleGetStartedClick = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleSignInClick = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
    setMobileMenuOpen(false);
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

        {/* --- CORRECTED MOBILE MENU SECTION --- */}
        <div className="md:hidden flex items-center gap-4">
          {user ? (
            // If logged in, show action icons directly (NO hamburger menu)
            <div className="flex items-center gap-5">
              <Link
                to="/applications"
                className="text-gray-700 hover:text-gray-800"
              >
                <Briefcase size={24} />
              </Link>
              <Link
                to="/saved-jobs"
                className="text-gray-700 hover:text-gray-800"
              >
                <FiBookmark size={24} />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            // If logged out, show only hamburger
            <button onClick={() => setMobileMenuOpen(true)}>
              <FiMenu className="w-8 h-8 text-gray-700" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay - ONLY FOR LOGGED-OUT USERS NOW */}
      {mobileMenuOpen && !user && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex flex-col md:hidden">
          <div className="bg-white shadow-xl rounded-b-2xl mx-4 mt-4 p-6 flex flex-col gap-6 animate-fadeInDown relative">
            <button
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700"
              onClick={() => navigate(-1)} // Go back
            >
              <FiArrowLeft size={22} />
            </button>
            <button
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiX size={22} />
            </button>

            {/* Logged-out options */}
            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={handleGetStartedClick}
                className="w-full bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-lg"
              >
                Get Started
              </button>
              <div className="text-center">
                <span className="text-gray-600">Already have an account?</span>
                <button
                  onClick={handleSignInClick}
                  className="text-gray-700 font-semibold hover:underline ml-2"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="flex-grow"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
};

Navbar.propTypes = {
  setShowAuthModal: PropTypes.func,
  setAuthMode: PropTypes.func,
  setShowRecruiterModal: PropTypes.func,
  setRecruiterMode: PropTypes.func,
};

export default Navbar;
