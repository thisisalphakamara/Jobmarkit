import { useRef } from "react";
import PropTypes from "prop-types";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import Footer from "../components/Footer";
import AIToolsSection from "../components/AIToolsSection";

const Home = ({
  setShowAuthModal,
  setAuthMode,
  setShowRecruiterModal,
  setRecruiterMode,
}) => {
  const jobListingRef = useRef(null);
  return (
    <div>
      <Navbar
        setShowAuthModal={setShowAuthModal}
        setAuthMode={setAuthMode}
        setShowRecruiterModal={setShowRecruiterModal}
        setRecruiterMode={setRecruiterMode}
      />
      <Hero jobListingRef={jobListingRef} />
      <div ref={jobListingRef}>
        <JobListing />
      </div>
      <AIToolsSection />
      <Footer />
    </div>
  );
};

Home.propTypes = {
  setShowAuthModal: PropTypes.func,
  setAuthMode: PropTypes.func,
  setShowRecruiterModal: PropTypes.func,
  setRecruiterMode: PropTypes.func,
};

export default Home;
