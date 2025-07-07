import React, { useRef } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import Footer from "../components/Footer";

const Home = ({ setShowAuthModal, setAuthMode }) => {
  const jobListingRef = useRef(null);
  return (
    <div>
      <Navbar setShowAuthModal={setShowAuthModal} setAuthMode={setAuthMode} />
      <Hero jobListingRef={jobListingRef} />
      <div ref={jobListingRef}>
        <JobListing />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
