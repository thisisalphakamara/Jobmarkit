import React, { useRef } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import Footer from "../components/Footer";

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
      <Footer />
    </div>
  );
};

export default Home;
