import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import Footer from "../components/Footer";
import Calltoaction from "../components/Calltoaction";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <JobListing />
      <Calltoaction />
      <Footer />
    </div>
  );
};

export default Home;
