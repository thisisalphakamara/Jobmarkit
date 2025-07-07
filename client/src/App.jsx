import React, { useContext, useState, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import ApplyJob from "./pages/ApplyJob";
import SavedJobs from "./pages/SavedJobs";
import RecruiterLogin from "./components/RecruiterLogin";
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

// Main Layout Component with Navbar
const MainLayout = ({ children, setShowAuthModal, setAuthMode }) => {
  return <div>{children}</div>;
};

const AppRoutes = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext);
  const { isAuthenticated } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Recruiter login - standalone page */}
        <Route path="/recruiter-login" element={<RecruiterLogin />} />

        {/* Main application routes - always with navbar */}
        <Route
          path="/"
          element={
            <MainLayout
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
            >
              <Home
                setShowAuthModal={setShowAuthModal}
                setAuthMode={setAuthMode}
              />
            </MainLayout>
          }
        />
        <Route
          path="/apply-job/:id"
          element={
            <MainLayout
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
            >
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
                <MainLayout
                  setShowAuthModal={setShowAuthModal}
                  setAuthMode={setAuthMode}
                >
                  <Applications />
                </MainLayout>
              }
            />
            <Route
              path="/saved-jobs"
              element={
                <MainLayout
                  setShowAuthModal={setShowAuthModal}
                  setAuthMode={setAuthMode}
                >
                  <SavedJobs />
                </MainLayout>
              }
            />
          </>
        )}

        {/* Recruiter routes - only accessible to authenticated recruiters with company token */}
        {companyToken && (
          <Route
            path="/dashboard"
            element={
              <MainLayout
                setShowAuthModal={setShowAuthModal}
                setAuthMode={setAuthMode}
              >
                <Dashboard />
              </MainLayout>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="add-job" element={<AddJob />} />
            <Route path="manage-job" element={<ManageJobs />} />
            <Route path="view-applications" element={<ViewApplications />} />
            <Route path="edit-job/:id" element={<EditJob />} />
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
      {showRecruiterLogin && <RecruiterLogin />}
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
