import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import ApplyJob from "./pages/ApplyJob";
import SavedJobs from "./pages/SavedJobs";
import RecruiterLogin from "./components/auth/RecruiterLogin";
import RecruiterSignUp from "./components/auth/RecruiterSignUp";
import { AppContext } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import Dashboard from "./pages/Dashboard";

import AddJob from "./pages/AddJob";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";
import EditJob from "./pages/EditJob";
import CustomSignIn from "./components/auth/CustomSignIn";
import CustomSignUp from "./components/auth/CustomSignUp";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardHome from "./pages/DashboardHome";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Jobs from "./pages/Jobs";
import ResumeBuilder from "./pages/ResumeBuilder";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AIResume from "./pages/AIResume";
import AICoverLetter from "./pages/AICoverLetter";
import AIInterviewPrep from "./pages/AIInterviewPrep";

// Main Layout Component
const MainLayout = ({ children }) => {
  return <div>{children}</div>;
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

const AppRoutes = () => {
  const { recruiterToken } = useContext(AppContext);
  const { isAuthenticated } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [recruiterMode, setRecruiterMode] = useState("signin");
  const [authMode, setAuthMode] = useState("signup");
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on an auth route and show as modal
  useEffect(() => {
    if (location.pathname === "/signin") {
      setAuthMode("signin");
      setShowAuthModal(true);
      // Navigate back to home but keep the modal open
      if (location.pathname !== "/") {
        navigate("/", { replace: true });
      }
    } else if (location.pathname === "/signup") {
      setAuthMode("signup");
      setShowAuthModal(true);
      // Navigate back to home but keep the modal open
      if (location.pathname !== "/") {
        navigate("/", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    // If we're not on the home page, navigate to home
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleSwitchAuthMode = (newMode) => {
    setAuthMode(newMode);
  };

  const handleCloseRecruiterModal = () => {
    setShowRecruiterModal(false);
  };

  const handleSwitchRecruiterMode = (newMode) => {
    setRecruiterMode(newMode);
  };

  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Recruiter routes - standalone pages */}
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
        <Route path="/recruiter-signup" element={<RecruiterSignUp />} />

        {/* Main application routes - always with navbar */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home
                setShowAuthModal={setShowAuthModal}
                setAuthMode={setAuthMode}
                setShowRecruiterModal={setShowRecruiterModal}
                setRecruiterMode={setRecruiterMode}
              />
            </MainLayout>
          }
        />
        <Route
          path="/jobs"
          element={
            <MainLayout>
              <Jobs />
            </MainLayout>
          }
        />
        <Route
          path="/resume-builder"
          element={
            <MainLayout>
              <ResumeBuilder />
            </MainLayout>
          }
        />
        <Route
          path="/pricing"
          element={
            <MainLayout>
              <Pricing />
            </MainLayout>
          }
        />
        <Route
          path="/about"
          element={
            <MainLayout>
              <About />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <Contact />
            </MainLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <MainLayout>
              <Privacy />
            </MainLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <MainLayout>
              <Terms />
            </MainLayout>
          }
        />
        <Route
          path="/ai/resume"
          element={
            <MainLayout>
              <AIResume />
            </MainLayout>
          }
        />
        <Route
          path="/ai/cover-letter"
          element={
            <MainLayout>
              <AICoverLetter />
            </MainLayout>
          }
        />
        <Route
          path="/ai/interview-prep"
          element={
            <MainLayout>
              <AIInterviewPrep />
            </MainLayout>
          }
        />
        <Route
          path="/apply-job/:id"
          element={
            <MainLayout>
              <ApplyJob />
            </MainLayout>
          }
        />

        {/* User routes - only accessible to authenticated users */}
        {isAuthenticated && (
          <>
            <Route
              path="/applications"
              element={
                <MainLayout>
                  <Applications />
                </MainLayout>
              }
            />
            <Route
              path="/saved-jobs"
              element={
                <MainLayout>
                  <SavedJobs />
                </MainLayout>
              }
            />
          </>
        )}

        {/* Recruiter Dashboard - accessible to all authenticated recruiters (individual and company) */}
        {recruiterToken && (
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="add-job" element={<AddJob />} />
            <Route path="manage-jobs" element={<ManageJobs />} />
            <Route path="view-applications" element={<ViewApplications />} />
            <Route path="edit-job/:id" element={<EditJob />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        )}

        {/* Catch-all route - redirect to home */}
        <Route
          path="*"
          element={
            <Home
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
            />
          }
        />
      </Routes>

      {/* Auth modals - shown over any page */}
      {showAuthModal &&
        (authMode === "signup" ? (
          <CustomSignUp
            onClose={handleCloseAuthModal}
            onSwitchToSignIn={() => handleSwitchAuthMode("signin")}
          />
        ) : (
          <CustomSignIn
            onClose={handleCloseAuthModal}
            onSwitchToSignUp={() => handleSwitchAuthMode("signup")}
          />
        ))}

      {/* Recruiter modals - shown over any page */}
      {showRecruiterModal &&
        (recruiterMode === "signup" ? (
          <RecruiterSignUp
            onClose={handleCloseRecruiterModal}
            onSwitchToSignIn={() => handleSwitchRecruiterMode("signin")}
          />
        ) : (
          <RecruiterLogin
            onClose={handleCloseRecruiterModal}
            onSwitchToSignUp={() => handleSwitchRecruiterMode("signup")}
          />
        ))}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
