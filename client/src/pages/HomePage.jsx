import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import RecommendedSection from '../components/RecommendedSection';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] font-sans">
      <main>
        <HeroSection />
        <RecommendedSection />
      </main>
    </div>
  );
};

export default Homepage;