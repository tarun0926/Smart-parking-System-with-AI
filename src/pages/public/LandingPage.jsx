import React from 'react';
import HeroSection from '../../components/landing/HeroSection';
import HowItWorks from '../../components/landing/HowItWorks';
import FeaturesSection from '../../components/landing/FeaturesSection';
import AIPredictionSection from '../../components/landing/AIPredictionSection';
import LiveMapPreview from '../../components/landing/LiveMapPreview';

export const LandingPage = () => {
  return (
    <div className="space-y-0">
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <AIPredictionSection />
      <LiveMapPreview />
    </div>
  );
};

export default LandingPage;
